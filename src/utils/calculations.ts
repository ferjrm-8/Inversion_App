import { AssetCategory, MonthRecord, YearData } from '../types/investment';

export interface MonthTotals {
  invested: number;
  valuation: number;
  profit: number;
  profitPercentage: number;
  otherFundsTotal: number;
  globalNetWorth: number;
  isClosed: boolean;
}

export function isMonthClosed(month: MonthRecord, allMonthsOrdered?: MonthRecord[]): boolean {
  if (!month || !month.hasData || !month.platforms || month.platforms.length === 0) {
    return false;
  }
  // If an ordered list of months with data is provided:
  if (allMonthsOrdered && allMonthsOrdered.length > 0) {
    const idx = allMonthsOrdered.findIndex((m) => m.id === month.id);
    if (idx !== -1) {
      const hasSubsequentCreated = idx < allMonthsOrdered.length - 1;
      // If a subsequent month has been created with data (e.g. August when September exists),
      // this month is CLOSED (unless explicitly reopened by user with false).
      if (hasSubsequentCreated) {
        return month.isClosed !== false;
      }
      // If it is the latest month (e.g. September when October is NOT yet created):
      // it is strictly IN-COURSE (not closed)!
      return false;
    }
  }
  // If explicitly flagged as closed and not undefined
  return month.isClosed === true;
}

export function calculateMonthTotals(month: MonthRecord, isClosedOverride?: boolean): MonthTotals {
  if (!month || !month.platforms || month.platforms.length === 0) {
    const otherFundsTotal = (month?.otherFunds || []).reduce((sum, f) => sum + (f.amount || 0), 0);
    return {
      invested: 0,
      valuation: 0,
      profit: 0,
      profitPercentage: 0,
      otherFundsTotal,
      globalNetWorth: otherFundsTotal,
      isClosed: isClosedOverride ?? (month?.isClosed === true),
    };
  }

  const invested = month.platforms.reduce((sum, p) => sum + (Number(p.invested) || 0), 0);
  const valuation = month.platforms.reduce((sum, p) => sum + (Number(p.valuation) || 0), 0);
  const profit = valuation - invested;
  const profitPercentage = invested > 0 ? (profit / invested) * 100 : 0;
  const otherFundsTotal = (month.otherFunds || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const globalNetWorth = valuation + otherFundsTotal;

  return {
    invested,
    valuation,
    profit,
    profitPercentage,
    otherFundsTotal,
    globalNetWorth,
    isClosed: isClosedOverride ?? (month.isClosed === true),
  };
}

export interface FlattenedMonth {
  id: string;
  year: number;
  month: number;
  monthName: string;
  dateLabel: string; // "Dic '21", "Ene '22"
  fullLabel: string; // "Enero 2022"
  invested: number;
  valuation: number;
  profit: number; // Valuation - Invested
  profitPercentage: number;
  monthlyNetProfit: number; // Profit generated this specific month vs previous month
  monthlyReturnPercent: number; // Return rate of the capital this month
  investedChange: number; // New capital deposited/withdrawn this month
  otherFundsTotal: number;
  globalNetWorth: number;
  globalNetWorthChange: number; // Month-over-month change in global net worth
  globalNetWorthReturnPct: number; // Month-over-month % change in global net worth
  hasData: boolean;
  isClosed: boolean; // true if finalized, false if in-course
  rawMonth: MonthRecord;
}

export function getAllFlattenedMonths(years: YearData[], options: { includeInCourse?: boolean } = { includeInCourse: true }): FlattenedMonth[] {
  const flattened: FlattenedMonth[] = [];
  const sortedYears = [...years].sort((a, b) => a.year - b.year);

  // First collect all months with data in chronological order
  const monthsWithData: { year: number; month: MonthRecord }[] = [];
  for (const yearData of sortedYears) {
    const sortedMonths = [...yearData.months].sort((a, b) => a.month - b.month);
    for (const m of sortedMonths) {
      if (m.hasData && m.platforms && m.platforms.length > 0) {
        monthsWithData.push({ year: yearData.year, month: m });
      }
    }
  }

  const totalCount = monthsWithData.length;
  let previousClosedTotals: MonthTotals | null = null;
  let previousClosedGlobalNetWorth: number | null = null;

  for (let i = 0; i < totalCount; i++) {
    const item = monthsWithData[i];
    const m = item.month;
    const hasSubsequentMonthWithData = i < totalCount - 1;

    // Strict rule: A month is closed if there is a subsequent month with data created
    // (e.g. August is closed because September exists).
    // The latest month (e.g. September, when October is not created yet) is strictly IN-COURSE (not closed).
    let isClosed = false;
    if (hasSubsequentMonthWithData) {
      isClosed = m.isClosed !== false;
    } else {
      // Latest active month is ALWAYS in-course as long as the next month hasn't been created
      isClosed = false;
    }

    if (!isClosed && !options.includeInCourse) {
      continue;
    }

    const totals = calculateMonthTotals(m, isClosed);
    const shortYear = String(m.year).slice(-2);
    const shortMonth = m.monthName.slice(0, 3);

    let investedChange = 0;
    let monthlyNetProfit = 0;
    let monthlyReturnPercent = 0;
    let globalNetWorthChange = 0;
    let globalNetWorthReturnPct = 0;

    if (isClosed) {
      // Closed month: compute profit & returns against the previous closed month
      if (previousClosedTotals) {
        investedChange = totals.invested - previousClosedTotals.invested;
        monthlyNetProfit = totals.profit - previousClosedTotals.profit;
        const baseline = previousClosedTotals.valuation + Math.max(0, investedChange);
        monthlyReturnPercent = baseline > 0 ? (monthlyNetProfit / baseline) * 100 : 0;
      } else {
        monthlyNetProfit = totals.profit;
        monthlyReturnPercent = totals.profitPercentage;
      }

      if (previousClosedGlobalNetWorth !== null) {
        globalNetWorthChange = totals.globalNetWorth - previousClosedGlobalNetWorth;
        globalNetWorthReturnPct = previousClosedGlobalNetWorth > 0 ? (globalNetWorthChange / previousClosedGlobalNetWorth) * 100 : 0;
      }
    } else {
      // In-course month (e.g. September): Net profit and return rate are 0 (open/provisional).
      // They NEVER distort performance metrics or drawdowns.
      monthlyNetProfit = 0;
      monthlyReturnPercent = 0;
      if (previousClosedTotals) {
        investedChange = totals.invested - previousClosedTotals.invested;
      }
      if (previousClosedGlobalNetWorth !== null) {
        globalNetWorthChange = totals.globalNetWorth - previousClosedGlobalNetWorth;
        globalNetWorthReturnPct = previousClosedGlobalNetWorth > 0 ? (globalNetWorthChange / previousClosedGlobalNetWorth) * 100 : 0;
      }
    }

    flattened.push({
      id: m.id,
      year: m.year,
      month: m.month,
      monthName: m.monthName,
      dateLabel: `${shortMonth} '${shortYear}`,
      fullLabel: `${m.monthName} ${m.year}`,
      invested: totals.invested,
      valuation: totals.valuation,
      profit: isClosed ? totals.profit : 0,
      profitPercentage: isClosed ? totals.profitPercentage : 0,
      monthlyNetProfit,
      monthlyReturnPercent,
      investedChange,
      otherFundsTotal: totals.otherFundsTotal,
      globalNetWorth: totals.globalNetWorth,
      globalNetWorthChange,
      globalNetWorthReturnPct,
      hasData: true,
      isClosed,
      rawMonth: m,
    });

    if (isClosed) {
      previousClosedTotals = totals;
      previousClosedGlobalNetWorth = totals.globalNetWorth;
    }
  }

  return flattened;
}

export interface AnnualSummary {
  year: number;
  startInvested: number;
  endInvested: number;
  investedIncrease: number;
  startValuation: number;
  endValuation: number;
  annualProfit: number; // profit generated in this year from closed months
  totalAccumulatedProfit: number; // total profit at end of year
  totalProfitPercentage: number;
  annualReturnPercentage: number;
  bestMonth: { monthName: string; profit: number; percent: number } | null;
  worstMonth: { monthName: string; profit: number; percent: number } | null;
  positiveMonthsCount: number;
  totalMonthsCount: number;
  hasInCourseMonth?: boolean;
}

export function calculateAnnualSummaries(years: YearData[]): AnnualSummary[] {
  // Only evaluate closed months for official metrics and returns so in-course months don't distort
  const flattened = getAllFlattenedMonths(years, { includeInCourse: false });
  const yearsMap = new Map<number, FlattenedMonth[]>();

  for (const m of flattened) {
    const list = yearsMap.get(m.year) || [];
    list.push(m);
    yearsMap.set(m.year, list);
  }

  const summaries: AnnualSummary[] = [];
  const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedYears.length; i++) {
    const yr = sortedYears[i];
    const months = yearsMap.get(yr) || [];
    if (months.length === 0) continue;

    const firstMonth = months[0];
    const lastMonth = months[months.length - 1];

    let prevYearEndProfit = 0;
    let prevYearEndInvested = firstMonth.invested;
    let prevYearEndValuation = firstMonth.valuation;

    if (i > 0) {
      const prevYearMonths = yearsMap.get(sortedYears[i - 1]) || [];
      if (prevYearMonths.length > 0) {
        const lastPrev = prevYearMonths[prevYearMonths.length - 1];
        prevYearEndProfit = lastPrev.profit;
        prevYearEndInvested = lastPrev.invested;
        prevYearEndValuation = lastPrev.valuation;
      }
    }

    const investedIncrease = lastMonth.invested - prevYearEndInvested;
    const annualProfit = lastMonth.profit - prevYearEndProfit;
    const annualReturnPercentage = prevYearEndInvested > 0 ? (annualProfit / prevYearEndInvested) * 100 : 0;

    let bestMonth: { monthName: string; profit: number; percent: number } | null = null;
    let worstMonth: { monthName: string; profit: number; percent: number } | null = null;
    let positiveMonthsCount = 0;

    for (const m of months) {
      if (m.monthlyNetProfit > 0) positiveMonthsCount++;
      if (!bestMonth || m.monthlyNetProfit > bestMonth.profit) {
        bestMonth = { monthName: m.monthName, profit: m.monthlyNetProfit, percent: m.monthlyReturnPercent };
      }
      if (!worstMonth || m.monthlyNetProfit < worstMonth.profit) {
        worstMonth = { monthName: m.monthName, profit: m.monthlyNetProfit, percent: m.monthlyReturnPercent };
      }
    }

    summaries.push({
      year: yr,
      startInvested: prevYearEndInvested,
      endInvested: lastMonth.invested,
      investedIncrease,
      startValuation: prevYearEndValuation,
      endValuation: lastMonth.valuation,
      annualProfit,
      totalAccumulatedProfit: lastMonth.profit,
      totalProfitPercentage: lastMonth.profitPercentage,
      annualReturnPercentage,
      bestMonth,
      worstMonth,
      positiveMonthsCount,
      totalMonthsCount: months.length,
    });
  }

  return summaries;
}

export interface GlobalKeyMetrics {
  currentInvested: number; // strictly from latest closed month
  currentValuation: number; // strictly from latest closed month
  totalProfit: number; // strictly from latest closed month
  totalProfitPercentage: number; // strictly from latest closed month
  currentGlobalNetWorth: number; // strictly from latest closed month
  totalCapitalInvestedIncrease: number; // strictly from latest closed month vs initial
  bestMonthEver: { label: string; profit: number; returnPct: number } | null;
  worstMonthEver: { label: string; profit: number; returnPct: number } | null;
  winRate: number; // % of positive months
  maxDrawdown: number; // percentage peak to trough drop
  activePlatformsCount: number;
  inCourseMonth: FlattenedMonth | null;
  inCourseInvested: number | null; // provisional invested note if in-course month exists
  lastClosedMonth: FlattenedMonth | null;
}

export function calculateGlobalMetrics(years: YearData[]): GlobalKeyMetrics {
  const allMonths = getAllFlattenedMonths(years, { includeInCourse: true });
  const closedMonths = allMonths.filter((m) => m.isClosed);
  const inCourseMonth = allMonths.find((m) => !m.isClosed) || null;

  if (closedMonths.length === 0) {
    const fallback = allMonths[0];
    return {
      currentInvested: fallback?.invested || 0,
      currentValuation: fallback?.valuation || 0,
      totalProfit: fallback?.profit || 0,
      totalProfitPercentage: fallback?.profitPercentage || 0,
      currentGlobalNetWorth: fallback?.globalNetWorth || 0,
      totalCapitalInvestedIncrease: 0,
      bestMonthEver: null,
      worstMonthEver: null,
      winRate: 0,
      maxDrawdown: 0,
      activePlatformsCount: 0,
      inCourseMonth,
      inCourseInvested: inCourseMonth ? inCourseMonth.invested : null,
      lastClosedMonth: null,
    };
  }

  const latestClosed = closedMonths[closedMonths.length - 1];
  const earliest = closedMonths[0];

  // Performance metrics & portfolio values cut off strictly at the last closed month
  const currentInvested = latestClosed.invested;
  const currentValuation = latestClosed.valuation;
  const totalProfit = latestClosed.profit;
  const totalProfitPercentage = latestClosed.profitPercentage;
  const currentGlobalNetWorth = latestClosed.globalNetWorth;

  const totalCapitalInvestedIncrease = currentInvested - earliest.invested;

  let bestMonthEver: { label: string; profit: number; returnPct: number } | null = null;
  let worstMonthEver: { label: string; profit: number; returnPct: number } | null = null;
  let positiveMonths = 0;

  let peakValuation = 0;
  let maxDrawdown = 0;

  for (const m of closedMonths) {
    if (m.monthlyNetProfit > 0) positiveMonths++;

    if (!bestMonthEver || m.monthlyNetProfit > bestMonthEver.profit) {
      bestMonthEver = { label: m.fullLabel, profit: m.monthlyNetProfit, returnPct: m.monthlyReturnPercent };
    }
    if (!worstMonthEver || m.monthlyNetProfit < worstMonthEver.profit) {
      worstMonthEver = { label: m.fullLabel, profit: m.monthlyNetProfit, returnPct: m.monthlyReturnPercent };
    }

    if (m.valuation > peakValuation) {
      peakValuation = m.valuation;
    } else if (peakValuation > 0) {
      const drop = ((peakValuation - m.valuation) / peakValuation) * 100;
      if (drop > maxDrawdown) {
        maxDrawdown = drop;
      }
    }
  }

  const winRate = closedMonths.length > 0 ? (positiveMonths / closedMonths.length) * 100 : 0;
  const activePlatformsCount = latestClosed.rawMonth.platforms.filter(
    (p) => p.invested > 0 || p.valuation > 0
  ).length;

  return {
    currentInvested,
    currentValuation,
    totalProfit,
    totalProfitPercentage,
    currentGlobalNetWorth,
    totalCapitalInvestedIncrease,
    bestMonthEver,
    worstMonthEver,
    winRate,
    maxDrawdown,
    activePlatformsCount,
    inCourseMonth,
    inCourseInvested: inCourseMonth ? inCourseMonth.invested : null,
    lastClosedMonth: latestClosed,
  };
}

export interface CategoryAllocation {
  category: AssetCategory;
  invested: number;
  valuation: number;
  profit: number;
  percentageOfPortfolio: number;
  platformsCount: number;
  color: string;
}

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  'Bolsa / Acciones': '#3b82f6',
  'Criptomonedas': '#f59e0b',
  'P2P / Crowdlending': '#10b981',
  'Inmobiliario': '#8b5cf6',
  'Otros': '#64748b',
};

export function calculateCategoryAllocations(month: MonthRecord): CategoryAllocation[] {
  if (!month || !month.platforms || month.platforms.length === 0) return [];

  const totals = calculateMonthTotals(month);
  const map = new Map<AssetCategory, { invested: number; valuation: number; count: number }>();

  for (const p of month.platforms) {
    const cat = p.category || 'Otros';
    const current = map.get(cat) || { invested: 0, valuation: 0, count: 0 };
    current.invested += Number(p.invested) || 0;
    current.valuation += Number(p.valuation) || 0;
    current.count += 1;
    map.set(cat, current);
  }

  const result: CategoryAllocation[] = [];
  map.forEach((data, cat) => {
    const profit = data.valuation - data.invested;
    const percentageOfPortfolio = totals.valuation > 0 ? (data.valuation / totals.valuation) * 100 : 0;
    result.push({
      category: cat,
      invested: data.invested,
      valuation: data.valuation,
      profit,
      percentageOfPortfolio,
      platformsCount: data.count,
      color: CATEGORY_COLORS[cat] || '#94a3b8',
    });
  });

  return result.sort((a, b) => b.valuation - a.valuation);
}

export function formatEuro(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatPercent(percentage: number): string {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}
