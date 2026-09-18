import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
  Calendar,
  Award,
  PieChart as PieIcon,
  BarChart2,
  Table as TableIcon,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { YearData } from '../types/investment';
import {
  calculateAnnualSummaries,
  calculateCategoryAllocations,
  calculateGlobalMetrics,
  formatEuro,
  formatPercent,
  getAllFlattenedMonths,
} from '../utils/calculations';
import { MONTH_NAMES_ES } from '../data/initialData';

interface AnalyticsTabProps {
  yearsData: YearData[];
}

const PLATFORM_COLORS = [
  '#a855f7', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#94a3b8', // Slate
];

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ yearsData }) => {
  const [timeframe, setTimeframe] = useState<'ALL' | 'LTM' | string>('ALL');

  // Closed months timeline for official returns & metrics so in-course months never distort
  const closedMonthsTimeline = useMemo(
    () => getAllFlattenedMonths(yearsData, { includeInCourse: false }),
    [yearsData]
  );
  // All months including in-course for global net worth track & invested notes
  const allMonthsTimeline = useMemo(
    () => getAllFlattenedMonths(yearsData, { includeInCourse: true }),
    [yearsData]
  );

  const annualSummaries = useMemo(() => calculateAnnualSummaries(yearsData), [yearsData]);
  const globalMetrics = useMemo(() => calculateGlobalMetrics(yearsData), [yearsData]);

  // Filtered data for closed charts based on timeframe
  const filteredClosedTimeline = useMemo(() => {
    if (timeframe === 'ALL') return closedMonthsTimeline;
    if (timeframe === 'LTM') {
      return closedMonthsTimeline.slice(-12);
    }
    const yearNum = parseInt(timeframe, 10);
    return closedMonthsTimeline.filter((m) => m.year === yearNum);
  }, [closedMonthsTimeline, timeframe]);

  // Filtered data for Net Worth evolution (strictly based on closed months up to last closed)
  const filteredNetWorthTimeline = useMemo(() => {
    if (timeframe === 'ALL') return closedMonthsTimeline;
    if (timeframe === 'LTM') {
      return closedMonthsTimeline.slice(-12);
    }
    const yearNum = parseInt(timeframe, 10);
    return closedMonthsTimeline.filter((m) => m.year === yearNum);
  }, [closedMonthsTimeline, timeframe]);

  // Latest closed month with finalized data for current allocations
  const latestClosedMonth = useMemo(() => {
    if (closedMonthsTimeline.length === 0) return null;
    return closedMonthsTimeline[closedMonthsTimeline.length - 1].rawMonth;
  }, [closedMonthsTimeline]);

  // Asset category allocations for latest closed month
  const categoryAllocations = useMemo(() => {
    if (!latestClosedMonth) return [];
    return calculateCategoryAllocations(latestClosedMonth);
  }, [latestClosedMonth]);

  // Platform allocations for latest closed month
  const platformAllocations = useMemo(() => {
    if (!latestClosedMonth || !latestClosedMonth.platforms) return [];
    const totalVal = latestClosedMonth.platforms.reduce((s, p) => s + (p.valuation || 0), 0);
    return latestClosedMonth.platforms
      .map((p, idx) => ({
        name: p.name,
        valuation: p.valuation,
        invested: p.invested,
        profit: p.valuation - p.invested,
        share: totalVal > 0 ? (p.valuation / totalVal) * 100 : 0,
        color: PLATFORM_COLORS[idx % PLATFORM_COLORS.length],
      }))
      .sort((a, b) => b.valuation - a.valuation);
  }, [latestClosedMonth]);

  // Monthly Heatmap Matrix (Only closed finalized months)
  const heatmapMatrix = useMemo(() => {
    const yearsMap = new Map<number, Record<number, { percent: number; profit: number; hasData: boolean }>>();

    for (const f of closedMonthsTimeline) {
      if (!yearsMap.has(f.year)) {
        yearsMap.set(f.year, {});
      }
      const mObj = yearsMap.get(f.year)!;
      mObj[f.month] = {
        percent: f.monthlyReturnPercent,
        profit: f.monthlyNetProfit,
        hasData: true,
      };
    }

    const rows: {
      year: number;
      months: (({ percent: number; profit: number; hasData: boolean } | null))[];
      annualProfit: number;
      annualReturn: number;
    }[] = [];

    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => b - a);

    for (const yr of sortedYears) {
      const yrMonths = yearsMap.get(yr) || {};
      const monthsArray = Array.from({ length: 12 }, (_, i) => yrMonths[i + 1] || null);

      const summary = annualSummaries.find((s) => s.year === yr);
      rows.push({
        year: yr,
        months: monthsArray,
        annualProfit: summary?.annualProfit || 0,
        annualReturn: summary?.annualReturnPercentage || 0,
      });
    }

    return rows;
  }, [closedMonthsTimeline, annualSummaries]);

  // Chart tooltip in dark mode
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl text-xs">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {entry.name.includes('%') || entry.name.includes('Rentabilidad') || entry.name.includes('Variación')
                  ? `${Number(entry.value).toFixed(2)}%`
                  : formatEuro(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Time Horizon Filter Bar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-2 sm:p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
          <Calendar className="h-4 w-4 text-slate-500 ml-1 shrink-0 hidden sm:inline" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0 hidden sm:inline mr-1">
            Periodo:
          </span>

          <button
            id="timeframe-all-btn"
            onClick={() => setTimeframe('ALL')}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              timeframe === 'ALL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Histórico Completo
          </button>
          <button
            id="timeframe-ltm-btn"
            onClick={() => setTimeframe('LTM')}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              timeframe === 'LTM'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Últimos 12M
          </button>
          {annualSummaries.map((s) => (
            <button
              key={s.year}
              id={`timeframe-year-${s.year}-btn`}
              onClick={() => setTimeframe(String(s.year))}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                timeframe === String(s.year)
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.year}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {/* KPI 1: Valoración Total Cartera */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              Valoración Cartera {globalMetrics.lastClosedMonth ? `(${globalMetrics.lastClosedMonth.monthName.slice(0, 3)})` : ''}
            </span>
            <div className="rounded-lg bg-purple-950/80 border border-purple-800/80 p-1 text-purple-400">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-white sm:text-2xl font-mono">
            {formatEuro(globalMetrics.currentValuation)}
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-slate-400">
            {globalMetrics.activePlatformsCount} plataformas activas
          </span>
        </div>

        {/* KPI 2: Capital Invertido */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              Invertido {globalMetrics.inCourseMonth ? '(Apunte Actual)' : ''}
            </span>
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-1 text-slate-300">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-white sm:text-2xl font-mono">
            {formatEuro(globalMetrics.currentInvested)}
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-slate-400 truncate">
            Aportes totales: +{formatEuro(globalMetrics.totalCapitalInvestedIncrease)}
          </span>
        </div>

        {/* KPI 3: Beneficio Total Acumulado */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Beneficio Consolidado</span>
            <div
              className={`rounded-lg p-1 border ${
                globalMetrics.totalProfit >= 0
                  ? 'bg-emerald-950/70 border-emerald-800/70 text-emerald-400'
                  : 'bg-rose-950/70 border-rose-800/70 text-rose-400'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <span
            className={`mt-2 block text-lg font-black sm:text-2xl font-mono ${
              globalMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {globalMetrics.totalProfit >= 0 ? `+${formatEuro(globalMetrics.totalProfit)}` : formatEuro(globalMetrics.totalProfit)}
          </span>
          <span
            className={`mt-0.5 block text-[10px] sm:text-xs font-bold ${
              globalMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(globalMetrics.totalProfitPercentage)} rentabilidad cartera
          </span>
        </div>

        {/* KPI 4: Patrimonio Neto Global */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/60 to-slate-950/80 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/20 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300">Patrimonio Global</span>
            <div className="rounded-lg bg-purple-900/70 border border-purple-700/60 p-1 text-purple-300">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-purple-200 sm:text-2xl font-mono">
            {formatEuro(globalMetrics.currentGlobalNetWorth)}
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-purple-300/80 truncate">
            Inversiones + Bancos / Otros fondos
          </span>
        </div>

        {/* KPI 5: Tasa de Éxito Mensual */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Meses Positivos</span>
            <div className="rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-400 p-1">
              <Percent className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-white sm:text-2xl font-mono">
            {globalMetrics.winRate.toFixed(1)}%
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-slate-400">
            Ratio de acierto consolidado
          </span>
        </div>

        {/* KPI 6: Mejor Mes Histórico */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Mejor Mes</span>
            <div className="rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-400 p-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-emerald-400 sm:text-2xl font-mono">
            {globalMetrics.bestMonthEver ? `+${formatEuro(globalMetrics.bestMonthEver.profit)}` : '0 €'}
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-slate-400 truncate">
            {globalMetrics.bestMonthEver?.label || 'N/A'}
          </span>
        </div>

        {/* KPI 7: Peor Mes Histórico */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Peor Mes</span>
            <div className="rounded-lg bg-rose-950/70 border border-rose-800 text-rose-400 p-1">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-rose-400 sm:text-2xl font-mono">
            {globalMetrics.worstMonthEver ? formatEuro(globalMetrics.worstMonthEver.profit) : '0 €'}
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-slate-400 truncate">
            {globalMetrics.worstMonthEver?.label || 'N/A'}
          </span>
        </div>

        {/* KPI 8: Máximo Drawdown */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Max Drawdown</span>
            <div className="rounded-lg bg-amber-950/70 border border-amber-800 text-amber-400 p-1">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="mt-2 block text-lg font-black text-amber-400 sm:text-2xl font-mono">
            -{globalMetrics.maxDrawdown.toFixed(1)}%
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-xs text-slate-400">
            Caída máx. en meses cerrados
          </span>
        </div>
      </div>

      {/* NEW MODULE: Cambio de Patrimonio Global Mes a Mes (Área + Barras de Variación) */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-emerald-500/20 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-emerald-400" />
              Evolución y Cambio de Patrimonio Global Mes a Mes
            </h3>
            <p className="text-[11px] text-slate-400">
              Patrimonio total acumulado (Inversiones + Otros Fondos / Bancos) y variación neta mensual en euros
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300">Patrimonio Global</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              <span className="text-purple-300">Cartera Invertida</span>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="mt-3 sm:mt-4 h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredNetWorthTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGlobalNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCarteraVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
              />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="globalNetWorth"
                name="Patrimonio Global"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorGlobalNetWorth)"
              />
              <Area
                type="monotone"
                dataKey="valuation"
                name="Cartera Inversión"
                stroke="#a855f7"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorCarteraVal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scrollable Month-by-Month Net Worth Change Table */}
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Variación del Patrimonio Global Mes a Mes</span>
            <span className="text-[10px] font-normal text-slate-500">Editable desde la pestaña Registro</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-800/60 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Mes</th>
                  <th className="py-2 px-3 text-right">Patrimonio Global</th>
                  <th className="py-2 px-3 text-right">Cartera Inversiones</th>
                  <th className="py-2 px-3 text-right">Otros Fondos</th>
                  <th className="py-2 px-3 text-right">Cambio Neto (€)</th>
                  <th className="py-2 px-3 text-right">Variación (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredNetWorthTimeline.slice().reverse().slice(0, 12).map((item) => {
                  const isPos = item.globalNetWorthChange >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-sans font-bold text-white flex items-center gap-1.5">
                        <span>{item.fullLabel}</span>
                        {!item.isClosed && (
                          <span className="rounded-sm bg-amber-950 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 border border-amber-800">
                            En curso
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                        {formatEuro(item.globalNetWorth)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {formatEuro(item.valuation)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {formatEuro(item.otherFundsTotal)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? `+${formatEuro(item.globalNetWorthChange)}` : formatEuro(item.globalNetWorthChange)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${
                            isPos
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70'
                              : 'bg-rose-950/70 text-rose-300 border border-rose-800/70'
                          }`}
                        >
                          {formatPercent(item.globalNetWorthReturnPct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart 1: Evolución: Invertido vs. Valoración Cartera (Meses cerrados para no distorsionar) */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Evolución: Invertido vs. Valoración de Cartera (Meses Consolidados)
            </h3>
            <p className="text-[11px] text-slate-400">
              Crecimiento de aportaciones frente al valor de mercado en meses cerrados
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-400">Invertido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-purple-300">Valoración</span>
            </div>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 h-60 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredClosedTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
              />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="invested"
                name="Invertido"
                stroke="#64748b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInvested)"
              />
              <Area
                type="monotone"
                dataKey="valuation"
                name="Valoración"
                stroke="#a855f7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorValuation)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Beneficio Neto Mensual (€ Generados por Mes) */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-400" />
              Resultado Neto Mensual (€ Generados por Mes Cerrado)
            </h3>
            <p className="text-[11px] text-slate-400">
              Rendimiento neto de cada mes liquidado aislando aportaciones y retiradas de capital
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold mt-1 sm:mt-0">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Beneficio
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Pérdida
            </span>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredClosedTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => `${val}€`}
              />
              <Tooltip content={customTooltip} />
              <Bar dataKey="monthlyNetProfit" name="Beneficio Neto Mes">
                {filteredClosedTimeline.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.monthlyNetProfit >= 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row of Two: Category Allocation + Platform Shares */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Category Allocation */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-purple-400" />
                  Distribución por Tipo de Activo
                </h3>
                <p className="text-[11px] text-slate-400">
                  Diversificación de cartera ({latestClosedMonth ? `${latestClosedMonth.monthName} ${latestClosedMonth.year}` : 'N/A'})
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAllocations}
                    dataKey="valuation"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryAllocations.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatEuro(Number(val))}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-3">
            {categoryAllocations.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-slate-300 truncate">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2.5 font-mono">
                  <span className="text-slate-400">{formatEuro(cat.valuation)}</span>
                  <span className="font-bold text-white w-12 text-right">
                    {cat.percentageOfPortfolio.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Allocation Bars */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  Cuota por Plataforma
                </h3>
                <p className="text-[11px] text-slate-400">
                  Desglose consolidado ({latestClosedMonth ? `${latestClosedMonth.monthName} ${latestClosedMonth.year}` : 'N/A'})
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2.5">
              {platformAllocations.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{p.name}</span>
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span className="text-slate-400">{formatEuro(p.valuation)}</span>
                      <span
                        className={`font-bold ${
                          p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {p.profit >= 0 ? `+${formatEuro(p.profit)}` : formatEuro(p.profit)}
                      </span>
                      <span className="font-bold text-white w-10 text-right">
                        {p.share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${p.share}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Heatmap Matrix (Only closed months) */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-purple-400" />
            Matriz de Rendimiento Mensual (% y Retorno por Año Consolidado)
          </h3>
          <p className="text-[11px] text-slate-400">
            Comportamiento mes a mes de tu cartera en meses liquidados
          </p>
        </div>

        <div className="overflow-x-auto p-2 sm:p-4">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] sm:text-[11px] font-bold uppercase text-slate-400">
                <th className="py-2 px-2 text-left">Año</th>
                {MONTH_NAMES_ES.map((m) => (
                  <th key={m} className="py-2 px-1 font-bold">
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="py-2 px-2 text-right bg-slate-800/40 font-extrabold text-slate-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {heatmapMatrix.map((row) => (
                <tr key={row.year} className="hover:bg-slate-800/30">
                  <td className="py-2 px-2 text-left font-bold font-sans text-white">
                    {row.year}
                  </td>
                  {row.months.map((m, idx) => {
                    if (!m || !m.hasData) {
                      return (
                        <td key={idx} className="py-2 px-1 text-slate-700">
                          -
                        </td>
                      );
                    }
                    const isPos = m.profit >= 0;
                    return (
                      <td key={idx} className="py-2 px-0.5 sm:px-1 text-center">
                        <span
                          title={`${MONTH_NAMES_ES[idx]} ${row.year}: ${isPos ? '+' : ''}${formatEuro(
                            m.profit
                          )} (${formatPercent(m.percent)})`}
                          className={`inline-block rounded-md px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold transition ${
                            isPos
                              ? 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-rose-950/80 text-rose-300 hover:bg-rose-900'
                          }`}
                        >
                          {formatPercent(m.percent)}
                        </span>
                      </td>
                    );
                  })}
                  {/* Annual Return */}
                  <td className="py-2 px-2 text-right font-extrabold bg-slate-950">
                    <span
                      className={`inline-block rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold ${
                        row.annualProfit >= 0
                          ? 'bg-emerald-900/80 text-emerald-300'
                          : 'bg-rose-900/80 text-rose-300'
                      }`}
                    >
                      {formatPercent(row.annualReturn)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consolidated Annual Summary Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-purple-500/10 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            Resumen Consolidado por Años
          </h3>
          <p className="text-[11px] text-slate-400">
            Aumento de capital aportado, valoraciones finales y beneficio generado en ejercicios cerrados
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Año</th>
                <th className="py-2.5 px-2 text-right">Inv. Inicio</th>
                <th className="py-2.5 px-2 text-right">Inv. Cierre</th>
                <th className="py-2.5 px-2 text-right">Aumento</th>
                <th className="py-2.5 px-2 text-right">Val. Cierre</th>
                <th className="py-2.5 px-2 text-right">Profit (€)</th>
                <th className="py-2.5 px-2 text-right">Rentab.</th>
                <th className="py-2.5 px-2 text-center">Meses +</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {annualSummaries.map((s) => (
                <tr key={s.year} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-bold font-sans text-white">{s.year}</td>
                  <td className="py-2.5 px-2 text-right">{formatEuro(s.startInvested)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-slate-200">{formatEuro(s.endInvested)}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-purple-400">
                    +{formatEuro(s.investedIncrease)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-white">
                    {formatEuro(s.endValuation)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    <span className={s.annualProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {s.annualProfit >= 0 ? `+${formatEuro(s.annualProfit)}` : formatEuro(s.annualProfit)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span
                      className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        s.annualReturnPercentage >= 0
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {formatPercent(s.annualReturnPercentage)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-sans">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {s.positiveMonthsCount}/{s.totalMonthsCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
