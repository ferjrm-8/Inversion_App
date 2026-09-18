import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AssetCategory, OtherFundItem, PlatformRecord, YearData } from '../types/investment';
import {
  calculateMonthTotals,
  formatEuro,
  formatPercent,
  getAllFlattenedMonths,
} from '../utils/calculations';
import { DEFAULT_PLATFORM_CATEGORIES, MONTH_NAMES_ES } from '../data/initialData';

interface DataEntryTabProps {
  yearsData: YearData[];
  selectedYear: number;
  selectedMonth: number;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
  onUpdateMonthData: (
    year: number,
    month: number,
    platforms: PlatformRecord[],
    otherFunds?: OtherFundItem[],
    notes?: string,
    isClosed?: boolean
  ) => void;
  onToggleMonthStatus: (year: number, month: number, newClosedStatus: boolean) => void;
  onAddNewYear: () => void;
  onDeleteYear: (year: number) => void;
  onDeleteMonth: (year: number, month: number) => void;
  onRolloverToNextMonth: (
    sourceYear: number,
    sourceMonth: number,
    rolloverMode: 'use_valuation' | 'keep_invested'
  ) => void;
}

const CATEGORY_OPTIONS: AssetCategory[] = [
  'Bolsa / Acciones',
  'Criptomonedas',
  'P2P / Crowdlending',
  'Inmobiliario',
  'Otros',
];

export const DataEntryTab: React.FC<DataEntryTabProps> = ({
  yearsData,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
  onUpdateMonthData,
  onToggleMonthStatus,
  onAddNewYear,
  onDeleteYear,
  onDeleteMonth,
  onRolloverToNextMonth,
}) => {
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [showDeleteYearModal, setShowDeleteYearModal] = useState(false);
  const [showDeleteMonthModal, setShowDeleteMonthModal] = useState(false);
  const [rolloverMode, setRolloverMode] = useState<'use_valuation' | 'keep_invested'>('keep_invested');

  // Quick add platform form state
  const [showAddPlatformForm, setShowAddPlatformForm] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformCategory, setNewPlatformCategory] = useState<AssetCategory>('Bolsa / Acciones');
  const [newPlatformInvested, setNewPlatformInvested] = useState<number | ''>('');
  const [newPlatformValuation, setNewPlatformValuation] = useState<number | ''>('');

  // Quick add fund form state
  const [showAddFundForm, setShowAddFundForm] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundAmount, setNewFundAmount] = useState<number | ''>('');
  const [newFundCategory, setNewFundCategory] = useState('Bancos / Cuentas');

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Locate selected year and month
  const currentYearData = yearsData.find((y) => y.year === selectedYear) || yearsData[yearsData.length - 1];
  const currentMonthData = currentYearData?.months.find((m) => m.month === selectedMonth) || currentYearData?.months[0];

  const platforms = currentMonthData?.platforms || [];
  const otherFunds = currentMonthData?.otherFunds || [];
  // Find previous month for comparative metrics
  const allFlattened = getAllFlattenedMonths(yearsData, { includeInCourse: true });
  const currentFlattenedIndex = allFlattened.findIndex(
    (f) => f.year === selectedYear && f.month === selectedMonth
  );
  const currentFlattened = currentFlattenedIndex >= 0 ? allFlattened[currentFlattenedIndex] : null;
  const isClosed = currentFlattened ? currentFlattened.isClosed : false;
  const currentMonthTotals = calculateMonthTotals(currentMonthData, isClosed);
  const prevFlattened = currentFlattenedIndex > 0 ? allFlattened[currentFlattenedIndex - 1] : null;

  // Next month calculation
  let nextMonthNumber = selectedMonth + 1;
  let nextYearNumber = selectedYear;
  if (nextMonthNumber > 12) {
    nextMonthNumber = 1;
    nextYearNumber = selectedYear + 1;
  }
  const nextMonthName = MONTH_NAMES_ES[nextMonthNumber - 1];

  // Platform handlers
  const handlePlatformChange = (
    id: string,
    field: 'invested' | 'valuation' | 'name' | 'category',
    val: string | number
  ) => {
    const updated = platforms.map((p) => {
      if (p.id !== id) return p;
      if (field === 'invested' || field === 'valuation') {
        const num = typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
        return { ...p, [field]: num };
      }
      return { ...p, [field]: val };
    });
    onUpdateMonthData(selectedYear, selectedMonth, updated, otherFunds, currentMonthData?.notes);
  };

  const handleAddPlatform = () => {
    if (!newPlatformName.trim()) return;
    const inv = typeof newPlatformInvested === 'number' ? newPlatformInvested : 0;
    const val = typeof newPlatformValuation === 'number' ? newPlatformValuation : inv;

    const newRecord: PlatformRecord = {
      id: `${newPlatformName.toLowerCase()}-${Date.now().toString(36)}`,
      name: newPlatformName.trim().toUpperCase(),
      category: newPlatformCategory,
      invested: inv,
      valuation: val,
    };

    const updated = [...platforms, newRecord];
    onUpdateMonthData(selectedYear, selectedMonth, updated, otherFunds, currentMonthData?.notes);

    setNewPlatformName('');
    setNewPlatformInvested('');
    setNewPlatformValuation('');
    setShowAddPlatformForm(false);
    showToast(`Plataforma ${newRecord.name} añadida`);
  };

  const handleDeletePlatform = (id: string, name: string) => {
    if (confirm(`¿Eliminar la plataforma ${name} de este mes?`)) {
      const updated = platforms.filter((p) => p.id !== id);
      onUpdateMonthData(selectedYear, selectedMonth, updated, otherFunds, currentMonthData?.notes);
      showToast(`Plataforma ${name} eliminada`);
    }
  };

  // Other Funds handlers (editable for ANY month past or present)
  const handleFundChange = (id: string, amount: number) => {
    const updated = otherFunds.map((f) => (f.id === id ? { ...f, amount } : f));
    onUpdateMonthData(selectedYear, selectedMonth, platforms, updated, currentMonthData?.notes);
  };

  const handleAddFund = () => {
    if (!newFundName.trim()) return;
    const amt = typeof newFundAmount === 'number' ? newFundAmount : 0;
    const newFund: OtherFundItem = {
      id: `fund-${Date.now().toString(36)}`,
      name: newFundName.trim(),
      amount: amt,
      category: newFundCategory,
    };
    const updated = [...otherFunds, newFund];
    onUpdateMonthData(selectedYear, selectedMonth, platforms, updated, currentMonthData?.notes);
    setNewFundName('');
    setNewFundAmount('');
    setShowAddFundForm(false);
    showToast(`Fondo "${newFund.name}" añadido`);
  };

  const handleDeleteFund = (id: string) => {
    const updated = otherFunds.filter((f) => f.id !== id);
    onUpdateMonthData(selectedYear, selectedMonth, platforms, updated, currentMonthData?.notes);
  };

  const handleExecuteRollover = () => {
    onRolloverToNextMonth(selectedYear, selectedMonth, rolloverMode);
    setShowRolloverModal(false);
    showToast(`¡Mes cerrado y traspasado a ${nextMonthName} ${nextYearNumber}!`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-center justify-center sm:justify-start gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-medium text-white shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Year Selector Horizontal Carousel */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-2 sm:p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="hidden sm:inline-block mr-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Año:
          </span>
          {yearsData.map((y) => (
            <button
              key={y.year}
              id={`year-btn-${y.year}`}
              onClick={() => onSelectYear(y.year)}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedYear === y.year
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {y.year}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="add-new-year-btn"
            onClick={onAddNewYear}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-slate-300 hover:border-purple-500 hover:text-white transition cursor-pointer"
            title="Añadir siguiente año"
          >
            <Plus className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden xs:inline">+ Año</span>
          </button>

          <button
            id="delete-year-btn"
            onClick={() => setShowDeleteYearModal(true)}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-dashed border-rose-900/60 bg-rose-950/30 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-rose-300 hover:border-rose-500 hover:bg-rose-950/60 hover:text-white transition cursor-pointer"
            title={`Eliminar año ${selectedYear}`}
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden xs:inline">Borrar Año</span>
          </button>
        </div>
      </div>

      {/* Month Selector Carousel */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-md backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-2 sm:p-3">
        <div className="flex items-center justify-between px-1 mb-1.5 sm:hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500">
            Mes ({currentMonthData.monthName} {selectedYear})
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
              isClosed ? 'bg-slate-800 text-slate-400' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
            }`}
          >
            {isClosed ? 'Cerrado' : 'En Curso'}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 sm:gap-2">
          {currentYearData.months.map((m) => {
            const isSelected = selectedMonth === m.month;
            const matchingFlattened = allFlattened.find((f) => f.id === m.id);
            const monthIsClosed = matchingFlattened ? matchingFlattened.isClosed : false;
            const totals = calculateMonthTotals(m, monthIsClosed);
            const hasData = m.hasData && m.platforms.length > 0;
            const isProfit = totals.profit >= 0;

            return (
              <button
                key={m.id}
                id={`month-btn-${m.month}`}
                onClick={() => onSelectMonth(m.month)}
                className={`flex flex-col items-center sm:items-start justify-between rounded-xl p-2 text-center sm:text-left border transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/60 text-white shadow-xs ring-1 ring-purple-500/50'
                    : hasData
                    ? monthIsClosed
                      ? 'border-slate-800 bg-slate-800/70 hover:border-slate-700 text-slate-200'
                      : 'border-amber-900/50 bg-amber-950/20 hover:border-amber-800 text-amber-200'
                    : 'border-slate-800/40 bg-slate-900/50 text-slate-600 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? 'text-purple-300'
                        : hasData
                        ? monthIsClosed
                          ? 'text-white'
                          : 'text-amber-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {m.monthName.slice(0, 3)}
                  </span>
                  {hasData && (
                    <span
                      className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                        !monthIsClosed
                          ? 'bg-amber-400 animate-pulse'
                          : isProfit
                          ? 'bg-emerald-400'
                          : 'bg-rose-400'
                      }`}
                      title={!monthIsClosed ? 'Mes en curso (abierto)' : isProfit ? 'Cerrado en positivo' : 'Cerrado en negativo'}
                    />
                  )}
                </div>

                <div className="mt-1 w-full text-center sm:text-left">
                  {hasData ? (
                    monthIsClosed ? (
                      <>
                        <span className="hidden sm:block text-[11px] font-semibold text-slate-200 truncate font-mono">
                          {formatEuro(totals.valuation)}
                        </span>
                        <span
                          className={`block text-[10px] font-mono font-bold truncate ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatPercent(totals.profitPercentage)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:block text-[11px] font-semibold text-amber-300 truncate font-mono">
                          {formatEuro(totals.invested)}
                        </span>
                        <span className="block text-[9px] font-bold text-amber-400 truncate uppercase tracking-tighter">
                          En curso
                        </span>
                      </>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-600 italic">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Executive Summary Banner */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/70 border border-purple-800/80 text-purple-400 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {currentMonthData.monthName} {selectedYear}
                </h2>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                  {platforms.length} plataformas
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    isClosed
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {isClosed ? 'Cerrado' : 'En Curso'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isClosed
                  ? 'Mes consolidado con resultado final liquidado'
                  : 'Registra aportaciones y posiciones iniciales; se cerrará al traspasar'}
              </p>
            </div>
          </div>

          {/* Actions CTA: Perfectly aligned in a single horizontal row with equal height */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="delete-month-btn"
              onClick={() => setShowDeleteMonthModal(true)}
              className="h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-900/70 bg-rose-950/40 px-3.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:border-rose-500 hover:text-white shadow-sm transition cursor-pointer"
              title={`Vaciar datos de ${currentMonthData.monthName} ${selectedYear}`}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Borrar mes</span>
            </button>

            <button
              id="open-rollover-modal-btn"
              onClick={() => setShowRolloverModal(true)}
              className="h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 text-xs font-bold text-white shadow-md shadow-purple-600/30 active:scale-98 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Traspasar a {nextMonthName}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 4 Metric Cards for Selected Month */}
        <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {/* Card 1: Invertido Inicio */}
          <div className="rounded-xl bg-slate-900/60 p-2.5 sm:p-3.5 border border-slate-700/40 backdrop-blur-md">
            <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Invertido Inicio
            </span>
            <span className="mt-1 block text-base sm:text-lg font-bold text-white font-mono">
              {formatEuro(currentMonthTotals.invested)}
            </span>
            <span className="mt-0.5 block text-[10px] text-slate-400 truncate">
              {prevFlattened
                ? `Aportación: ${currentMonthTotals.invested - prevFlattened.invested >= 0 ? '+' : ''}${formatEuro(
                    currentMonthTotals.invested - prevFlattened.invested
                  )}`
                : 'Base inicial'}
            </span>
          </div>

          {/* Card 2: Valoración Cierre / Estado */}
          <div className="rounded-xl bg-slate-900/60 p-2.5 sm:p-3.5 border border-slate-700/40 backdrop-blur-md">
            <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Valoración {isClosed ? 'Cierre' : '(En Curso)'}
            </span>
            <span className="mt-1 block text-base sm:text-lg font-bold font-mono text-white">
              {formatEuro(currentMonthTotals.valuation)}
            </span>
            <span
              className={`mt-0.5 block text-[10px] font-medium truncate ${
                isClosed ? 'text-slate-400' : 'text-amber-400'
              }`}
            >
              {isClosed ? 'Valor liquidado' : 'Pendiente de cierre'}
            </span>
          </div>

          {/* Card 3: Resultado / Beneficio */}
          <div className="rounded-xl bg-slate-900/60 p-2.5 sm:p-3.5 border border-slate-700/40 backdrop-blur-md">
            <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Beneficio Mes (Profit)
            </span>
            {isClosed ? (
              <>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-base sm:text-lg font-bold font-mono ${
                      currentMonthTotals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentMonthTotals.profit >= 0 ? `+${formatEuro(currentMonthTotals.profit)}` : formatEuro(currentMonthTotals.profit)}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    currentMonthTotals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercent(currentMonthTotals.profitPercentage)} rentabilidad
                </span>
              </>
            ) : (
              <>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
                    -- €
                  </span>
                </div>
                <span className="text-[10px] font-medium text-amber-400/90 truncate">
                  Se calcula al traspasar
                </span>
              </>
            )}
          </div>

          {/* Card 4: Patrimonio Global de este mes */}
          <div className="rounded-xl bg-purple-950/50 p-2.5 sm:p-3.5 border border-purple-800/40 backdrop-blur-md">
            <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-purple-300">
              Patrimonio Mes
            </span>
            <span className="mt-1 block text-base sm:text-lg font-bold text-purple-200 font-mono">
              {formatEuro(currentMonthTotals.globalNetWorth)}
            </span>
            <span className="mt-0.5 block text-[10px] text-purple-400/80 truncate">
              Cartera + Otros ({formatEuro(currentMonthTotals.otherFundsTotal)})
            </span>
          </div>
        </div>
      </div>

      {/* Main Positions Section */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Posiciones ({currentMonthData.monthName} {selectedYear})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isClosed
                ? 'Valores finales del mes consolidado'
                : 'Posición de arranque y apuntes del mes en curso'}
            </p>
          </div>

          <button
            onClick={() => setShowAddPlatformForm(!showAddPlatformForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Plus className="h-3.5 w-3.5 text-purple-400" />
            <span>Añadir</span>
          </button>
        </div>

        {/* Collapsible Add Form */}
        {showAddPlatformForm && (
          <div className="border-b border-slate-800 bg-slate-800/40 p-3 sm:p-4 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-purple-400" />
              <span>Nueva Plataforma en {currentMonthData.monthName}</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              <input
                id="new-platform-name-input"
                type="text"
                placeholder="Nombre (ej. BITPANDA, MINTOS)"
                value={newPlatformName}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewPlatformName(name);
                  const suggestedCat = DEFAULT_PLATFORM_CATEGORIES[name.toUpperCase()];
                  if (suggestedCat) setNewPlatformCategory(suggestedCat);
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />

              <select
                id="new-platform-category-select"
                value={newPlatformCategory}
                onChange={(e) => setNewPlatformCategory(e.target.value as AssetCategory)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                id="new-platform-invested-input"
                type="number"
                placeholder="Invertido (€)"
                value={newPlatformInvested}
                onChange={(e) =>
                  setNewPlatformInvested(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />

              <input
                id="new-platform-valuation-input"
                type="number"
                placeholder="Valoración (€)"
                value={newPlatformValuation}
                onChange={(e) =>
                  setNewPlatformValuation(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex gap-2">
                <button
                  id="submit-add-platform-btn"
                  onClick={handleAddPlatform}
                  disabled={!newPlatformName.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 disabled:opacity-50 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={() => setShowAddPlatformForm(false)}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE VIEW: Touch-optimized Card List for smartphones */}
        <div className="block md:hidden divide-y divide-slate-800">
          {platforms.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Building2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs">No hay plataformas registradas en este mes.</p>
              {prevFlattened && (
                <button
                  onClick={() => {
                    onRolloverToNextMonth(prevFlattened.year, prevFlattened.month, 'keep_invested');
                  }}
                  className="mt-3 inline-block rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-purple-400 font-semibold border border-slate-700"
                >
                  Copiar plataformas de {prevFlattened.monthName} {prevFlattened.year}
                </button>
              )}
            </div>
          ) : (
            platforms.map((p) => {
              const profit = p.valuation - p.invested;
              const profitPct = p.invested > 0 ? (profit / p.invested) * 100 : 0;
              const isPositive = profit >= 0;

              return (
                <div key={p.id} className="p-3.5 space-y-2.5 bg-slate-900/60">
                  {/* Card Header: Platform name, category badge & delete button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-wide">
                        {p.name}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                        {p.category || 'Otros'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isClosed ? (
                        <div className="text-right font-mono">
                          <span
                            className={`text-xs font-bold ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${formatEuro(profit)}` : formatEuro(profit)}
                          </span>
                          <span
                            className={`ml-1 text-[10px] font-bold ${
                              isPositive ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          >
                            ({formatPercent(profitPct)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                          En curso
                        </span>
                      )}
                      <button
                        onClick={() => handleDeletePlatform(p.id, p.name)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Inputs: Invertido & Valoración side by side */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2">
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
                        Invertido Arranque (€)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={p.invested}
                        onChange={(e) => handlePlatformChange(p.id, 'invested', e.target.value)}
                        className="w-full bg-transparent font-mono text-xs font-bold text-slate-200 focus:outline-hidden focus:text-white"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2">
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
                        {isClosed ? 'Valoración Final (€)' : 'Valoración Actual (€)'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={p.valuation}
                        onChange={(e) => handlePlatformChange(p.id, 'valuation', e.target.value)}
                        className="w-full bg-transparent font-mono text-xs font-bold text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Footer Total Card */}
          {platforms.length > 0 && (
            <div className="p-3.5 bg-slate-950/80 backdrop-blur-md border-t-2 border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>TOTALES {currentMonthData.monthName.toUpperCase()}</span>
                {isClosed ? (
                  <span className={currentMonthTotals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {currentMonthTotals.profit >= 0 ? `+${formatEuro(currentMonthTotals.profit)}` : formatEuro(currentMonthTotals.profit)} ({formatPercent(currentMonthTotals.profitPercentage)})
                  </span>
                ) : (
                  <span className="text-amber-400 text-[11px] font-mono font-bold">
                    (Apunte en curso)
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Inv: {formatEuro(currentMonthTotals.invested)}</span>
                <span className="font-bold text-white">Val: {formatEuro(currentMonthTotals.valuation)}</span>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW: Table for Large Screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Plataforma</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Invertido (€)</th>
                <th className="py-3 px-3 text-right">Valoración (€)</th>
                <th className="py-3 px-3 text-right">Resultado (€)</th>
                <th className="py-3 px-3 text-right">Rentabilidad (%)</th>
                <th className="py-3 px-4 text-center w-12">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {platforms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    <Building2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    No hay plataformas registradas para este mes.
                  </td>
                </tr>
              ) : (
                platforms.map((p) => {
                  const profit = p.valuation - p.invested;
                  const profitPct = p.invested > 0 ? (profit / p.invested) * 100 : 0;
                  const isPositive = profit >= 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors group font-sans"
                    >
                      {/* Name */}
                      <td className="py-2.5 px-4 font-bold text-white font-sans">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) =>
                            handlePlatformChange(p.id, 'name', e.target.value.toUpperCase())
                          }
                          className="w-full bg-transparent font-bold text-white focus:outline-hidden focus:bg-slate-800 rounded px-1.5 py-0.5"
                        />
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 font-sans">
                        <select
                          value={p.category || 'Otros'}
                          onChange={(e) =>
                            handlePlatformChange(p.id, 'category', e.target.value as AssetCategory)
                          }
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Invested Input */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 focus-within:border-purple-500">
                          <input
                            type="number"
                            step="any"
                            value={p.invested}
                            onChange={(e) => handlePlatformChange(p.id, 'invested', e.target.value)}
                            className="w-24 text-right font-bold text-slate-200 focus:outline-hidden"
                          />
                          <span className="ml-1 text-slate-500">€</span>
                        </div>
                      </td>

                      {/* Valuation Input */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 focus-within:border-purple-500">
                          <input
                            type="number"
                            step="any"
                            value={p.valuation}
                            onChange={(e) => handlePlatformChange(p.id, 'valuation', e.target.value)}
                            className="w-24 text-right font-bold text-white focus:outline-hidden"
                          />
                          <span className="ml-1 text-slate-500">€</span>
                        </div>
                      </td>

                      {/* Profit in Euros */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {isClosed ? (
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${formatEuro(profit)}` : formatEuro(profit)}
                          </span>
                        ) : (
                          <span className="text-amber-400/80 text-[11px]">En curso</span>
                        )}
                      </td>

                      {/* Profit % */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {isClosed ? (
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              isPositive
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950/70 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {formatPercent(profitPct)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Pendiente</span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleDeletePlatform(p.id, p.name)}
                          title="Eliminar posición"
                          className="rounded-lg p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Desktop Table Footer */}
            {platforms.length > 0 && (
              <tfoot className="border-t-2 border-slate-800 bg-slate-950 font-bold text-white font-mono">
                <tr>
                  <td className="py-3 px-4 text-xs uppercase tracking-wider font-extrabold font-sans" colSpan={2}>
                    TOTALES {currentMonthData.monthName.toUpperCase()} {selectedYear}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {formatEuro(currentMonthTotals.invested)}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {formatEuro(currentMonthTotals.valuation)}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {isClosed ? (
                      <span
                        className={
                          currentMonthTotals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {currentMonthTotals.profit >= 0
                          ? `+${formatEuro(currentMonthTotals.profit)}`
                          : formatEuro(currentMonthTotals.profit)}
                      </span>
                    ) : (
                      <span className="text-amber-400 text-xs">(Mes en curso)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {isClosed ? (
                      <span
                        className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold ${
                          currentMonthTotals.profit >= 0
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : 'bg-rose-900/60 text-rose-300'
                        }`}
                      >
                        {formatPercent(currentMonthTotals.profitPercentage)}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">-</span>
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Other Funds & Global Capital Section (Editable for ANY month past or present) */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Otros Fondos & Patrimonio Global ({currentMonthData.monthName} {selectedYear})
                </h3>
                <span className="rounded-md bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                  Editable en cualquier mes
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Añade o ajusta cuentas bancarias (EVO, ING), vehículos o liquidez de cualquier mes anterior para mantener al día el histórico
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 rounded-xl bg-slate-950 px-3.5 py-2 border border-slate-800">
            <span className="text-[11px] text-slate-400">Patrimonio Global {currentMonthData.monthName.slice(0, 3)}:</span>
            <span className="font-mono text-sm font-extrabold text-emerald-400">
              {formatEuro(currentMonthTotals.globalNetWorth)}
            </span>
          </div>
        </div>

        {/* Existing other funds */}
        <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {otherFunds.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-500 italic">
              No hay otros fondos registrados para este mes. Puedes añadir cuentas bancarias o liquidez abajo.
            </div>
          ) : (
            otherFunds.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 sm:p-3"
              >
                <div className="flex-1 mr-2 min-w-0">
                  <span className="block text-xs font-bold text-slate-200 truncate">{f.name}</span>
                  <span className="text-[10px] text-slate-500">{f.category || 'Fondo'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={f.amount}
                    onChange={(e) => handleFundChange(f.id, Number(e.target.value) || 0)}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs font-bold text-white font-mono focus:outline-hidden focus:border-purple-500"
                  />
                  <span className="text-xs text-slate-500">€</span>
                  <button
                    onClick={() => handleDeleteFund(f.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Fund Form */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            placeholder="Nuevo fondo (ej. EVO Banco, Efectivo)"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 flex-1 min-w-[160px]"
          />
          <input
            type="number"
            placeholder="Importe (€)"
            value={newFundAmount}
            onChange={(e) => setNewFundAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono"
          />
          <button
            onClick={handleAddFund}
            disabled={!newFundName.trim()}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition"
          >
            <Plus className="h-3.5 w-3.5 text-purple-400" />
            <span>Añadir a {currentMonthData.monthName}</span>
          </button>
        </div>
      </div>

      {/* Rollover Modal */}
      {showRolloverModal && (
        <div
          id="rollover-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-md flex items-center justify-center min-h-screen animate-in fade-in duration-150"
        >
          <div
            id="rollover-modal-card"
            className="relative w-full max-w-md my-auto rounded-2xl bg-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-800 text-slate-200 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950 border border-purple-800 text-purple-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Cerrar y Traspasar a {nextMonthName} {nextYearNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentMonthData.monthName} quedará cerrado y arrancará {nextMonthName} como mes en curso
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p>
                ¿Cómo deseas inicializar el capital invertido al arrancar {nextMonthName}?
              </p>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                  rolloverMode === 'keep_invested'
                    ? 'border-purple-500 bg-purple-950/40 text-white'
                    : 'border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="rolloverMode"
                  checked={rolloverMode === 'keep_invested'}
                  onChange={() => setRolloverMode('keep_invested')}
                  className="mt-0.5 text-purple-500"
                />
                <div>
                  <strong className="block font-semibold text-white">
                    Mantener capital invertido original
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Arranca el siguiente mes con el mismo invertido acumulado ({formatEuro(currentMonthTotals.invested)}). Ideal para seguir el flujo de depósitos reales.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                  rolloverMode === 'use_valuation'
                    ? 'border-purple-500 bg-purple-950/40 text-white'
                    : 'border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="rolloverMode"
                  checked={rolloverMode === 'use_valuation'}
                  onChange={() => setRolloverMode('use_valuation')}
                  className="mt-0.5 text-purple-500"
                />
                <div>
                  <strong className="block font-semibold text-white">
                    Reinvertir beneficios (Capital = Valoración Final)
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Consolida las ganancias fijando el nuevo punto de partida de inversión en {formatEuro(currentMonthTotals.valuation)}.
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                id="cancel-rollover-btn"
                onClick={() => setShowRolloverModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="confirm-rollover-btn"
                onClick={handleExecuteRollover}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 transition cursor-pointer"
              >
                Confirmar y Traspasar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Year */}
      {showDeleteYearModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-md flex items-center justify-center min-h-screen animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto rounded-2xl border border-rose-500/30 bg-slate-950 p-4 sm:p-5 shadow-2xl ring-1 ring-rose-500/20 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold">¿Eliminar el año {selectedYear}?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Se eliminarán todos los 12 meses y las plataformas registradas para el año <strong>{selectedYear}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteYearModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteYear(selectedYear);
                  setShowDeleteYearModal(false);
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 cursor-pointer transition"
              >
                Sí, eliminar año
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Month Data */}
      {showDeleteMonthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-md flex items-center justify-center min-h-screen animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto rounded-2xl border border-rose-500/30 bg-slate-950 p-4 sm:p-5 shadow-2xl ring-1 ring-rose-500/20 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold">¿Vaciar datos de {currentMonthData.monthName} {selectedYear}?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Se borrarán todas las plataformas, fondos adicionales y notas correspondientes a <strong>{currentMonthData.monthName} {selectedYear}</strong>.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteMonthModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMonth(selectedYear, selectedMonth);
                  setShowDeleteMonthModal(false);
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 cursor-pointer transition"
              >
                Sí, vaciar mes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
