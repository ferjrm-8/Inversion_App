import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DataEntryTab } from './components/DataEntryTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { OtherFundItem, PlatformRecord, YearData } from './types/investment';
import { INITIAL_YEARS_DATA, MONTH_NAMES_ES } from './data/initialData';
import { getAllFlattenedMonths } from './utils/calculations';

// Application state key for durable local storage
const STORAGE_KEY = 'mis_inversiones_app_data_v1';

export default function App() {
  const [yearsData, setYearsData] = useState<YearData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage, using initial dataset', e);
    }
    return INITIAL_YEARS_DATA;
  });

  const [activeTab, setActiveTab] = useState<'data' | 'analytics'>('data');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9);

  // Save to localStorage on any data change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(yearsData));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }
  }, [yearsData]);

  // Update month data
  const handleUpdateMonthData = (
    year: number,
    month: number,
    platforms: PlatformRecord[],
    otherFunds?: OtherFundItem[],
    notes?: string,
    isClosed?: boolean
  ) => {
    setYearsData((prev) =>
      prev.map((y) => {
        if (y.year !== year) return y;
        const updatedMonths = y.months.map((m) => {
          if (m.month !== month) return m;
          return {
            ...m,
            platforms,
            otherFunds: otherFunds ?? m.otherFunds,
            notes: notes ?? m.notes,
            isClosed: isClosed !== undefined ? isClosed : m.isClosed,
            hasData: platforms.length > 0,
          };
        });
        return { ...y, months: updatedMonths };
      })
    );
  };

  // Toggle month status (Closed vs In-Course)
  const handleToggleMonthStatus = (year: number, month: number, newClosedStatus: boolean) => {
    setYearsData((prev) =>
      prev.map((y) => {
        if (y.year !== year) return y;
        return {
          ...y,
          months: y.months.map((m) => (m.month === month ? { ...m, isClosed: newClosedStatus } : m)),
        };
      })
    );
  };

  // Add next year
  const handleAddNewYear = () => {
    const maxYear = Math.max(...yearsData.map((y) => y.year));
    const newYearNumber = maxYear + 1;

    const newYear: YearData = {
      year: newYearNumber,
      months: Array.from({ length: 12 }, (_, i) => ({
        id: `${newYearNumber}-${String(i + 1).padStart(2, '0')}`,
        year: newYearNumber,
        month: i + 1,
        monthName: MONTH_NAMES_ES[i],
        platforms: [],
        hasData: false,
      })),
    };

    setYearsData((prev) => [...prev, newYear]);
    setSelectedYear(newYearNumber);
    setSelectedMonth(1);
  };

  // Rollover positions from source month to next month
  // CRITICAL: When rolling over, sourceMonth is finalized (isClosed = true),
  // and the new target month is marked as in-course (isClosed = false)
  const handleRolloverToNextMonth = (
    sourceYear: number,
    sourceMonth: number,
    rolloverMode: 'use_valuation' | 'keep_invested'
  ) => {
    let targetYear = sourceYear;
    let targetMonth = sourceMonth + 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear = sourceYear + 1;
    }

    setYearsData((prev) => {
      let data = [...prev];
      // If target year doesn't exist yet, create it
      if (!data.some((y) => y.year === targetYear)) {
        const newYear: YearData = {
          year: targetYear,
          months: Array.from({ length: 12 }, (_, i) => ({
            id: `${targetYear}-${String(i + 1).padStart(2, '0')}`,
            year: targetYear,
            month: i + 1,
            monthName: MONTH_NAMES_ES[i],
            platforms: [],
            hasData: false,
          })),
        };
        data.push(newYear);
      }

      // Find source month
      const sourceYearData = data.find((y) => y.year === sourceYear);
      const sourceMonthData = sourceYearData?.months.find((m) => m.month === sourceMonth);
      if (!sourceMonthData) return data;

      // Map platforms to new month: starting capital = rollover selection, valuation = same as initial invested
      const newPlatforms: PlatformRecord[] = sourceMonthData.platforms.map((p) => {
        const newInvested = rolloverMode === 'use_valuation' ? p.valuation : p.invested;
        return {
          id: `${p.name.toLowerCase()}-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .substring(2, 5)}`,
          name: p.name,
          category: p.category,
          invested: newInvested,
          valuation: newInvested, // Initial valuation matches starting invested at start of month
        };
      });

      // Also carry over other funds (EVO, ING, etc.)
      const newOtherFunds: OtherFundItem[] = (sourceMonthData.otherFunds || []).map((f) => ({
        ...f,
        id: `fund-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      }));

      return data.map((y) => {
        const isSourceYear = y.year === sourceYear;
        const isTargetYear = y.year === targetYear;

        if (!isSourceYear && !isTargetYear) return y;

        return {
          ...y,
          months: y.months.map((m) => {
            // Finalize source month
            if (isSourceYear && m.month === sourceMonth) {
              return { ...m, isClosed: true };
            }
            // Initialize target month as in-course (in progress)
            if (isTargetYear && m.month === targetMonth) {
              return {
                ...m,
                platforms: newPlatforms,
                otherFunds: newOtherFunds,
                hasData: true,
                isClosed: false,
              };
            }
            return m;
          }),
        };
      });
    });

    setSelectedYear(targetYear);
    setSelectedMonth(targetMonth);
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setYearsData(INITIAL_YEARS_DATA);
    setSelectedYear(2026);
    setSelectedMonth(9);
  };

  const handleImportData = (imported: YearData[]) => {
    setYearsData(imported);
    if (imported.length > 0) {
      setSelectedYear(imported[imported.length - 1].year);
      setSelectedMonth(1);
    }
  };

  const handleExportCSV = () => {
    const flattened = getAllFlattenedMonths(yearsData, { includeInCourse: true });
    const rows = [
      ['Año', 'Mes', 'Estado', 'Plataforma', 'Categoría', 'Invertido (€)', 'Valoración (€)', 'Profit (€)', 'Profit (%)'],
    ];

    for (const f of flattened) {
      for (const p of f.rawMonth.platforms) {
        const profit = p.valuation - p.invested;
        const pct = p.invested > 0 ? ((profit / p.invested) * 100).toFixed(2) : '0';
        rows.push([
          String(f.year),
          f.monthName,
          f.isClosed ? 'Cerrado' : 'En Curso',
          p.name,
          p.category || 'Otros',
          String(p.invested),
          String(p.valuation),
          String(profit),
          pct,
        ]);
      }
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cartera_inversiones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white pb-6 sm:pb-8">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        yearsData={yearsData}
        onResetData={handleResetData}
        onImportData={handleImportData}
        onExportCSV={handleExportCSV}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">
        {activeTab === 'data' ? (
          <DataEntryTab
            yearsData={yearsData}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            onUpdateMonthData={handleUpdateMonthData}
            onToggleMonthStatus={handleToggleMonthStatus}
            onAddNewYear={handleAddNewYear}
            onRolloverToNextMonth={handleRolloverToNextMonth}
          />
        ) : (
          <AnalyticsTab yearsData={yearsData} />
        )}
      </main>
    </div>
  );
}
