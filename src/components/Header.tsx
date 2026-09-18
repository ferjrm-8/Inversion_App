import React, { useRef, useState } from 'react';
import {
  Zap,
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
  LogOut,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { UserAccount, YearData } from '../types/investment';
import { calculateGlobalMetrics, formatEuro } from '../utils/calculations';
import { exportJSONFile, exportCSVFile, copyJSONToClipboard } from '../utils/exportUtils';

interface HeaderProps {
  activeTab: 'data' | 'analytics';
  setActiveTab: (tab: 'data' | 'analytics') => void;
  yearsData: YearData[];
  onResetData: () => void;
  onImportData: (imported: YearData[]) => void;
  account: UserAccount | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'local';
  lastSyncedAt: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onForceSaveCloud: () => Promise<void>;
  onReloadFromCloud: () => Promise<void>;
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
  lastSyncedAt,
  onOpenAuth,
  onLogout,
  onForceSaveCloud,
  onReloadFromCloud,
  onShowToast,
}) => {
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
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
    const success = await copyJSONToClipboard(yearsData);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast('Datos copiados al portapapeles');
    } else {
      onShowToast('Error al copiar datos');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let importedYears: YearData[] = [];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].months) {
          importedYears = parsed;
        } else if (parsed.years && Array.isArray(parsed.years)) {
          importedYears = parsed.years;
        } else {
          throw new Error('Formato de archivo JSON no reconocido');
        }

        onImportData(importedYears);
        setShowDataMenu(false);
        onShowToast(`Importación exitosa: ${importedYears.length} años cargados`);
      } catch (err: any) {
        console.error('Error parsing imported file:', err);
        onShowToast('Error: El archivo no contiene un JSON válido de la aplicación');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/60 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-600 shadow-lg shadow-purple-600/30 text-white">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                Mis Inversiones
              </h1>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Gestor patrimonial mensual multidispositivo
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-1.5 text-xs shadow-md shadow-black/30 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-slate-400 font-medium">Patrimonio Actual:</span>
              <span className="font-bold text-white">{formatEuro(globalMetrics.currentValuation)}</span>
            </div>
            <div className="h-3 w-px bg-slate-700/60" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Rentabilidad Total:</span>
              <span
                className={`font-bold ${
                  globalMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {globalMetrics.totalProfit >= 0 ? '+' : ''}
                {formatEuro(globalMetrics.totalProfit)} ({globalMetrics.totalProfitPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tab Navigation (Registro vs Métricas) */}
            <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-700/60 shadow-inner">
              <button
                id="tab-data-entry-btn"
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === 'data'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/60'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                <span>Registro</span>
              </button>

              <button
                id="tab-analytics-btn"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Métricas</span>
              </button>
            </div>

            {/* Cloud Auth & Status Button */}
            {!account ? (
              <button
                id="login-btn-top"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-purple-600/25 transition cursor-pointer"
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
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-md transition cursor-pointer backdrop-blur-md ${
                    syncStatus === 'syncing'
                      ? 'border-amber-500/40 bg-amber-950/60 text-amber-300 hover:bg-amber-900/60'
                      : syncStatus === 'offline'
                      ? 'border-rose-500/40 bg-rose-950/60 text-rose-300'
                      : 'border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/40'
                  }`}
                  title={`Conectado como ${account.displayName}. Clic para ver opciones.`}
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                  ) : syncStatus === 'offline' ? (
                    <CloudOff className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <CloudCheck className="h-3.5 w-3.5 text-purple-400" />
                  )}
                  <span>
                    {syncStatus === 'syncing'
                      ? 'Sincronizando...'
                      : syncStatus === 'offline'
                      ? 'Sin conexión'
                      : 'Sincronizado'}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="text-xs font-bold text-white truncate">
                          {account.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{account.emailOrUsername}</p>
                        {lastSyncedAt && (
                          <p className="mt-1 text-[10px] text-slate-500">
                            Última lectura/guardado: {lastSyncedAt}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-purple-300 font-medium">
                          <CloudCheck className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                          <span>Guardado automático en la nube</span>
                        </div>
                      </div>

                      <div className="py-1 space-y-1">
                        <button
                          disabled={isManualSyncing}
                          onClick={async () => {
                            setIsManualSyncing(true);
                            setShowUserMenu(false);
                            await onReloadFromCloud();
                            setIsManualSyncing(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-purple-300 hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 text-purple-400 ${isManualSyncing ? 'animate-spin' : ''}`} />
                          <span>Descargar / Recargar de la Nube</span>
                        </button>

                        <button
                          disabled={isManualSyncing}
                          onClick={async () => {
                            setIsManualSyncing(true);
                            setShowUserMenu(false);
                            await onForceSaveCloud();
                            setIsManualSyncing(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <CloudUpload className="h-3.5 w-3.5 text-purple-400" />
                          <span>Subir y Guardar en la Nube Ahora</span>
                        </button>

                        <div className="border-t border-slate-800 my-1" />

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 text-rose-400" />
                          <span>Cerrar Sesión</span>
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
                className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 shadow-md hover:bg-slate-700 hover:text-white transition cursor-pointer backdrop-blur-md"
                title="Copia de seguridad y exportar"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1">Backup</span>
              </button>

              {showDataMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowDataMenu(false)}
                  />
                  <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                    <button
                      id="export-json-btn"
                      onClick={handleExportJSON}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-purple-400" />
                      Descargar Copia JSON
                    </button>

                    <button
                      id="export-csv-btn"
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-purple-400" />
                      Exportar a Excel (CSV)
                    </button>

                    <button
                      id="copy-json-clipboard-btn"
                      onClick={handleCopyClipboard}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      {copied ? '¡Copiado!' : 'Copiar JSON al portapapeles'}
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      id="import-json-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-emerald-400" />
                      Importar Backup JSON
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      id="reset-data-btn"
                      onClick={() => {
                        if (
                          window.confirm(
                            '¿Estás seguro de que deseas reiniciar todos los datos a la plantilla inicial?'
                          )
                        ) {
                          onResetData();
                          setShowDataMenu(false);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                      Reiniciar a plantilla
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hidden file input for JSON import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
