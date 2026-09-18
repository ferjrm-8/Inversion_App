import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DataEntryTab } from './components/DataEntryTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AuthModal } from './components/AuthModal';
import { CloudAccount, OtherFundItem, PlatformRecord, YearData } from './types/investment';
import { INITIAL_YEARS_DATA, MONTH_NAMES_ES } from './data/initialData';
import {
  clearStoredAccount,
  getStoredAccount,
  savePortfolioToCloud,
  subscribePortfolioFromCloud,
} from './firebase';

// Local storage key for portfolio data
const getStorageKey = (accountId?: string) =>
  accountId ? `mis_inversiones_data_${accountId}` : 'mis_inversiones_data_local_v2';

export default function App() {
  const [account, setAccount] = useState<CloudAccount | null>(() => getStoredAccount());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>(
    account ? 'synced' : 'local'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [yearsData, setYearsData] = useState<YearData[]>(() => {
    try {
      const initialAccount = getStoredAccount();
      const storageKey = getStorageKey(initialAccount?.accountId);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.months) {
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

  // Ref to prevent triggering auto-save loop when data is received from cloud subscription
  const isReceivingCloudDataRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast notifier
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Subscribe to cloud changes when account is active
  useEffect(() => {
    if (!account) {
      setSyncStatus('local');
      return;
    }

    setSyncStatus('syncing');
    isReceivingCloudDataRef.current = true;

    // Load local cache for this account first
    const storageKey = getStorageKey(account.accountId);
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.months) {
          setYearsData(parsed);
        }
      } catch (e) {
        console.warn('Error loading cached account data', e);
      }
    }

    const unsubscribe = subscribePortfolioFromCloud(
      account.accountId,
      (cloudData) => {
        if (cloudData && cloudData.length > 0) {
          isReceivingCloudDataRef.current = true;
          setYearsData(cloudData);
          try {
            localStorage.setItem(storageKey, JSON.stringify(cloudData));
          } catch (e) {
            console.warn(e);
          }
          setSyncStatus('synced');
          setTimeout(() => {
            isReceivingCloudDataRef.current = false;
          }, 300);
        }
      },
      (err) => {
        console.error('Subscription error:', err);
        setSyncStatus('offline');
        isReceivingCloudDataRef.current = false;
      }
    );

    setTimeout(() => {
      isReceivingCloudDataRef.current = false;
      setSyncStatus('synced');
    }, 800);

    return () => {
      unsubscribe();
    };
  }, [account]);

  // AUTO-SAVE ON EVERY CHANGE (LocalStorage + Cloud)
  useEffect(() => {
    const storageKey = getStorageKey(account?.accountId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(yearsData));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }

    // If not connected to cloud or if this update came directly from the cloud, skip pushing
    if (!account || isReceivingCloudDataRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus('syncing');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await savePortfolioToCloud(
          account.accountId,
          yearsData,
          account.displayName,
          account.pin
        );
        setSyncStatus('synced');
      } catch (err) {
        console.error('Cloud auto-save error:', err);
        setSyncStatus('offline');
      }
    }, 450);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [yearsData, account]);

  // Force manual cloud save
  const handleForceSaveCloud = async () => {
    if (!account) {
      setIsAuthOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      await savePortfolioToCloud(
        account.accountId,
        yearsData,
        account.displayName,
        account.pin
      );
      setSyncStatus('synced');
      showToast('Cartera guardada en la nube con éxito');
    } catch (err) {
      console.error(err);
      setSyncStatus('offline');
      showToast('Error al conectar con la nube');
    }
  };

  // Handle Logout / Disconnect Cloud
  const handleLogout = () => {
    clearStoredAccount();
    setAccount(null);
    setSyncStatus('local');

    // Load guest data
    const guestKey = getStorageKey();
    const savedGuest = localStorage.getItem(guestKey);
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setYearsData(parsed);
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      setYearsData(INITIAL_YEARS_DATA);
    }
    showToast('Desconectado de la nube');
  };

  // Success handler from AuthModal
  const handleAuthSuccess = (connectedAccount: CloudAccount, loadedData?: YearData[]) => {
    setAccount(connectedAccount);
    if (loadedData && loadedData.length > 0) {
      setYearsData(loadedData);
      const maxYear = Math.max(...loadedData.map((y) => y.year));
      setSelectedYear(maxYear);
    }
    showToast(`Conectado a la cartera de ${connectedAccount.displayName}`);
  };

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
    showToast(`Año ${newYearNumber} añadido`);
  };

  // Rollover positions from source month to next month
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

      const sourceYearData = data.find((y) => y.year === sourceYear);
      const sourceMonthData = sourceYearData?.months.find((m) => m.month === sourceMonth);
      if (!sourceMonthData) return data;

      const newPlatforms: PlatformRecord[] = sourceMonthData.platforms.map((p) => {
        const newInvested = rolloverMode === 'use_valuation' ? p.valuation : p.invested;
        return {
          id: `${p.name.toLowerCase()}-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .substring(2, 5)}`,
          name: p.name,
          category: p.category,
          invested: newInvested,
          valuation: newInvested,
        };
      });

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
            if (isSourceYear && m.month === sourceMonth) {
              return { ...m, isClosed: true };
            }
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
    showToast(`Posiciones traspasadas a ${MONTH_NAMES_ES[targetMonth - 1]} ${targetYear}`);
  };

  const handleResetData = () => {
    const key = getStorageKey(account?.accountId);
    localStorage.removeItem(key);
    setYearsData(INITIAL_YEARS_DATA);
    setSelectedYear(2026);
    setSelectedMonth(9);
    showToast('Datos reiniciados a la plantilla original');
  };

  const handleImportData = (imported: YearData[]) => {
    setYearsData(imported);
    if (imported.length > 0) {
      setSelectedYear(imported[imported.length - 1].year);
      setSelectedMonth(1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white pb-6 sm:pb-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        yearsData={yearsData}
        onResetData={handleResetData}
        onImportData={handleImportData}
        account={account}
        syncStatus={syncStatus}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onForceSaveCloud={handleForceSaveCloud}
        onShowToast={showToast}
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        currentYearsData={yearsData}
        currentAccount={account}
      />
    </div>
  );
}
