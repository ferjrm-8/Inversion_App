import React, { useRef, useState } from 'react';
import {
  TrendingUp,
  Table,
  BarChart3,
  Download,
  Upload,
  RotateCcw,
  Wallet,
  FileSpreadsheet,
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudOff,
  User as UserIcon,
  LogOut,
  Copy,
  Check,
} from 'lucide-react';
import { CloudAccount, YearData } from '../types/investment';
import { calculateGlobalMetrics, formatEuro } from '../utils/calculations';
import { exportJSONFile, exportCSVFile, copyJSONToClipboard } from '../utils/exportUtils';

interface HeaderProps {
  activeTab: 'data' | 'analytics';
  setActiveTab: (tab: 'data' | 'analytics') => void;
  yearsData: YearData[];
  onResetData: () => void;
  onImportData: (imported: YearData[]) => void;
  account: CloudAccount | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'local';
  onOpenAuth: () => void;
  onLogout: () => void;
  onForceSaveCloud: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  yearsData,
  onResetData,
  onImportData,
  account,
  syncStatus,
  onOpenAuth,
  onLogout,
  onForceSaveCloud,
  onShowToast,
}) => {
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const globalMetrics = calculateGlobalMetrics(yearsData);

  const handleExportJSON = async () => {
    setShowDataMenu(false);
    const res = await exportJSONFile(yearsData);
    onShowToast(res.message);
  };

  const handleExportCSV = async () => {
    setShowDataMenu(false);
    const res = await exportCSVFile(yearsData);
    onShowToast(res.message);
  };

  const handleCopyClipboard = async () => {
    setShowDataMenu(false);
    const ok = await copyJSONToClipboard(yearsData);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast('Copia de seguridad copiada al portapapeles');
    } else {
      onShowToast('No se pudo copiar al portapapeles');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportData(parsed);
          setShowDataMenu(false);
          onShowToast('Datos restaurados correctamente');
        } else {
          alert('El archivo no tiene el formato esperado de años de inversión.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-1.5 sm:gap-4">
          {/* Brand and Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-white shadow-xs">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                Mis Inversiones
              </h1>
              <p className="hidden sm:block text-[11px] text-slate-400 truncate">
                Control mensual de posiciones y patrimonio
              </p>
            </div>
          </div>

          {/* Quick Portfolio Stats Pill (Tablet / Desktop) */}
          <div className="hidden md:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/50 px-3.5 py-1 text-xs">
            <div>
              <span className="block text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Valoración {globalMetrics.lastClosedMonth ? `(${globalMetrics.lastClosedMonth.monthName.slice(0, 3)})` : ''}
              </span>
              <span className="font-bold text-white text-xs sm:text-sm font-mono">
                {formatEuro(globalMetrics.currentValuation)}
              </span>
            </div>
            <div className="h-5 w-px bg-slate-700" />
            <div>
              <span className="block text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Profit {globalMetrics.lastClosedMonth ? `(${globalMetrics.lastClosedMonth.monthName.slice(0, 3)})` : ''}
              </span>
              <span
                className={`font-bold text-xs sm:text-sm font-mono ${
                  globalMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {globalMetrics.totalProfit >= 0 ? `+${formatEuro(globalMetrics.totalProfit)}` : formatEuro(globalMetrics.totalProfit)}
              </span>
            </div>
            <div className="h-5 w-px bg-slate-700" />
            <div>
              <span className="block text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Patrimonio Total {globalMetrics.lastClosedMonth ? `(${globalMetrics.lastClosedMonth.monthName.slice(0, 3)})` : ''}
              </span>
              <span className="font-bold text-indigo-400 text-xs sm:text-sm font-mono flex items-center gap-1">
                <Wallet className="h-3 w-3 inline text-indigo-400" />
                {formatEuro(globalMetrics.currentGlobalNetWorth)}
              </span>
            </div>
          </div>

          {/* Actions & Tab Selectors */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Switcher Tabs (Compact on mobile) */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                id="tab-data-entry-btn"
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'data'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                <span className="text-[11px] sm:text-xs">Registro</span>
              </button>
              <button
                id="tab-analytics-btn"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-[11px] sm:text-xs">Métricas</span>
              </button>
            </div>

            {/* Cloud Auth & Status Button */}
            {!account ? (
              <button
                id="login-btn-top"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Sincronizar datos en la nube y compartir"
              >
                <Cloud className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Conectar Nube</span>
                <span className="sm:hidden">Conectar</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer ${
                    syncStatus === 'syncing'
                      ? 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                      : 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                  title={`Conectado como ${account.displayName}. Clic para ver opciones.`}
                >
                  {syncStatus === 'syncing' ? (
                    <CloudUpload className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                  ) : (
                    <CloudCheck className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span>
                    {syncStatus === 'syncing' ? 'Guardando...' : 'Conectado'}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="text-xs font-bold text-white truncate">
                          {account.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">ID: {account.accountId}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                          <CloudCheck className="h-3.5 w-3.5" />
                          <span>Autoguardado en tiempo real activo</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={async () => {
                            setShowUserMenu(false);
                            await onForceSaveCloud();
                            onShowToast('Cartera guardada en la Nube');
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <CloudUpload className="h-3.5 w-3.5 text-indigo-400" />
                          Guardar en la Nube Ahora
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                            onShowToast('Desconectado de la Nube');
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 text-rose-400" />
                          Desconectar Nube
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Data Management Dropdown (JSON Backup, CSV, Import) */}
            <div className="relative">
              <button
                id="data-menu-toggle-btn"
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 shadow-2xs hover:bg-slate-700 hover:text-white transition"
                title="Copia de seguridad y exportar"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1 text-xs">Copias</span>
              </button>

              {showDataMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowDataMenu(false)}
                  />
                  <div
                    id="data-dropdown-menu"
                    className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Opciones de Datos y Descargas
                    </div>
                    <button
                      id="export-json-btn"
                      onClick={handleExportJSON}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-400" />
                      Descargar Copia (JSON)
                    </button>
                    <button
                      id="export-csv-btn"
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      Descargar Excel / CSV
                    </button>
                    <button
                      id="copy-clipboard-btn"
                      onClick={handleCopyClipboard}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      Copiar JSON al Portapapeles
                    </button>
                    <button
                      id="import-json-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                    >
                      <Upload className="h-3.5 w-3.5 text-amber-400" />
                      Restaurar Copia (JSON)
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      id="reset-data-btn"
                      onClick={() => {
                        if (
                          confirm(
                            '¿Seguro que deseas reiniciar los datos a la plantilla original de tus hojas de cálculo?'
                          )
                        ) {
                          onResetData();
                          setShowDataMenu(false);
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                      Restablecer Histórico Original
                    </button>
                  </div>
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Mobile Quick Stats Sub-bar */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-800/80 py-1.5 px-1 text-[11px]">
          <div className="flex items-center gap-1 font-mono">
            <span className="text-slate-400">Val:</span>
            <span className="font-bold text-white">
              {formatEuro(globalMetrics.currentValuation)}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-slate-400">Profit:</span>
            <span
              className={`font-bold ${
                globalMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {globalMetrics.totalProfit >= 0 ? `+${formatEuro(globalMetrics.totalProfit)}` : formatEuro(globalMetrics.totalProfit)}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-slate-400">Total:</span>
            <span className="font-bold text-indigo-400">
              {formatEuro(globalMetrics.currentGlobalNetWorth)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
