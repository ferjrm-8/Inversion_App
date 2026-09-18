import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DataEntryTab } from './components/DataEntryTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AuthModal } from './components/AuthModal';
import { UserAccount, OtherFundItem, PlatformRecord, YearData } from './types/investment';
import { INITIAL_YEARS_DATA, MONTH_NAMES_ES } from './data/initialData';
import investmentBg from './assets/investment_bg.jpg';
import {
  getStoredUserSession,
  clearStoredUserSession,
  savePortfolioToCloud,
  loadPortfolioFromCloud,
  subscribePortfolioFromCloud,
} from './firebase';

const getStorageKey = (userId?: string) =>
  userId ? `mis_inversiones_data_${userId}` : 'mis_inversiones_data_local_v3';

export default function App() {
  const [account, setAccount] = useState<UserAccount | null>(() => getStoredUserSession());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>(
    account ? 'syncing' : 'local'
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [yearsData, setYearsData] = useState<YearData[]>(() => {
    try {
      const initialUser = getStoredUserSession();
      const storageKey = getStorageKey(initialUser?.userId);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.months) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
    return INITIAL_YEARS_DATA;
  });

  const [activeTab, setActiveTab] = useState<'data' | 'analytics'>('data');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9);

  // Guards to prevent race conditions and accidental overwrites
  const isInitializedFromCloudRef = useRef(false);
  const isLocallyModifiedRef = useRef(false);
  const isReceivingCloudDataRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // 1. Initial Cloud Load when user account is active or changes
  useEffect(() => {
    if (!account) {
      setSyncStatus('local');
      isInitializedFromCloudRef.current = false;
      isLocallyModifiedRef.current = false;
      return;
    }

    let isMounted = true;
    setSyncStatus('syncing');

    async function initialFetch() {
      if (!account) return;
      try {
        const cloudResult = await loadPortfolioFromCloud(account.userId);
        if (!isMounted) return;

        const storageKey = getStorageKey(account.userId);

        if (cloudResult && cloudResult.yearsData && cloudResult.yearsData.length > 0) {
          // Cloud has data: ALWAYS prioritize and update state from cloud!
          setYearsData(cloudResult.yearsData);
          try {
            localStorage.setItem(storageKey, JSON.stringify(cloudResult.yearsData));
          } catch (e) {
            console.warn(e);
          }
          const maxYear = Math.max(...cloudResult.yearsData.map((y) => y.year));
          setSelectedYear(maxYear);
          setLastSyncedAt(new Date().toLocaleTimeString());
          showToast(`Datos sincronizados desde la nube (${account.displayName})`);
        } else {
          // New account with no data in cloud yet: upload initial template
          await savePortfolioToCloud(account.userId, yearsData, account.displayName);
          setLastSyncedAt(new Date().toLocaleTimeString());
        }

        isInitializedFromCloudRef.current = true;
        isLocallyModifiedRef.current = false;
        setSyncStatus('synced');
      } catch (err) {
        console.error('Initial cloud fetch error:', err);
        if (!isMounted) return;
        setSyncStatus('offline');
        isInitializedFromCloudRef.current = true; // Allow local offline edits
      }
    }

    initialFetch();

    // 2. Real-time Subscription for changes pushed from OTHER devices
    const unsubscribe = subscribePortfolioFromCloud(
      account.userId,
      (incomingCloudData) => {
        if (!isMounted) return;
        if (incomingCloudData && Array.isArray(incomingCloudData) && incomingCloudData.length > 0) {
          // If the user isn't actively editing on this device, sync the latest incoming data
          if (!isLocallyModifiedRef.current) {
            isReceivingCloudDataRef.current = true;
            setYearsData(incomingCloudData);
            const storageKey = getStorageKey(account.userId);
            try {
              localStorage.setItem(storageKey, JSON.stringify(incomingCloudData));
            } catch (e) {
              console.warn(e);
            }
            setLastSyncedAt(new Date().toLocaleTimeString());
            setSyncStatus('synced');
            setTimeout(() => {
              isReceivingCloudDataRef.current = false;
            }, 400);
          }
        }
      },
      (err) => {
        console.warn('Real-time subscription error:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [account]);

  // 3. Auto-save ONLY when user explicitly modified data locally
  useEffect(() => {
    const storageKey = getStorageKey(account?.userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(yearsData));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }

    // Safety guard: Do NOT save to cloud if not logged in, not initialized, or if receiving incoming cloud data
    if (
      !account ||
      !isInitializedFromCloudRef.current ||
      !isLocallyModifiedRef.current ||
      isReceivingCloudDataRef.current
    ) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus('syncing');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await savePortfolioToCloud(
          account.userId,
          yearsData,
          account.displayName
        );
        isLocallyModifiedRef.current = false;
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Cloud auto-save error:', err);
        setSyncStatus('offline');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [yearsData, account]);

  // Manual: Force reload latest from cloud
  const handleReloadFromCloud = async () => {
    if (!account) {
      setIsAuthOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      const cloudResult = await loadPortfolioFromCloud(account.userId);
      if (cloudResult && cloudResult.yearsData && cloudResult.yearsData.length > 0) {
        isReceivingCloudDataRef.current = true;
        setYearsData(cloudResult.yearsData);
        const storageKey = getStorageKey(account.userId);
        localStorage.setItem(storageKey, JSON.stringify(cloudResult.yearsData));
        isLocallyModifiedRef.current = false;
        setLastSyncedAt(new Date().toLocaleTimeString());
        setSyncStatus('synced');
        showToast('Cartera recargada y actualizada desde la nube');
        setTimeout(() => {
          isReceivingCloudDataRef.current = false;
        }, 300);
      } else {
        setSyncStatus('synced');
        showToast('No hay datos más recientes en la nube');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('offline');
      showToast('Error al conectar con la base de datos');
    }
  };

  // Manual: Force upload to cloud
  const handleForceSaveCloud = async () => {
    if (!account) {
      setIsAuthOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      await savePortfolioToCloud(
        account.userId,
        yearsData,
        account.displayName
      );
      isLocallyModifiedRef.current = false;
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString());
      showToast('Cartera guardada y sincronizada en la nube');
    } catch (err) {
      console.error(err);
      setSyncStatus('offline');
      showToast('Error al conectar con la base de datos');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    clearStoredUserSession();
    setAccount(null);
    setSyncStatus('local');
    isInitializedFromCloudRef.current = false;
    isLocallyModifiedRef.current = false;

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
    showToast('Sesión cerrada');
  };

  // Success handler from AuthModal
  const handleAuthSuccess = (connectedAccount: UserAccount, loadedData?: YearData[]) => {
    setAccount(connectedAccount);
    isInitializedFromCloudRef.current = true;
    isLocallyModifiedRef.current = false;
    if (loadedData && loadedData.length > 0) {
      setYearsData(loadedData);
      const maxYear = Math.max(...loadedData.map((y) => y.year));
      setSelectedYear(maxYear);
    }
    setLastSyncedAt(new Date().toLocaleTimeString());
    setSyncStatus('synced');
    showToast(`Bienvenido ${connectedAccount.displayName}, datos sincronizados`);
  };

  // User Action: Update month data
  const handleUpdateMonthData = (
    year: number,
    month: number,
    platforms: PlatformRecord[],
    otherFunds?: OtherFundItem[],
    notes?: string,
    isClosed?: boolean
  ) => {
    isLocallyModifiedRef.current = true;
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

  // User Action: Toggle month status (Closed vs In-Course)
  const handleToggleMonthStatus = (year: number, month: number, newClosedStatus: boolean) => {
    isLocallyModifiedRef.current = true;
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

  // User Action: Add next year
  const handleAddNewYear = () => {
    isLocallyModifiedRef.current = true;
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

  // User Action: Rollover positions from source month to next month
  const handleRolloverToNextMonth = (
    sourceYear: number,
    sourceMonth: number,
    rolloverMode: 'use_valuation' | 'keep_invested'
  ) => {
    isLocallyModifiedRef.current = true;
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

  // User Action: Delete entire year
  const handleDeleteYear = (yearToDelete: number) => {
    isLocallyModifiedRef.current = true;
    setYearsData((prev) => {
      const remaining = prev.filter((y) => y.year !== yearToDelete);
      if (remaining.length === 0) {
        const currentYr = new Date().getFullYear();
        const emptyYear: YearData = {
          year: currentYr,
          months: Array.from({ length: 12 }, (_, i) => ({
            id: `${currentYr}-${String(i + 1).padStart(2, '0')}`,
            year: currentYr,
            month: i + 1,
            monthName: MONTH_NAMES_ES[i],
            platforms: [],
            hasData: false,
            isClosed: false,
          })),
        };
        setSelectedYear(currentYr);
        setSelectedMonth(1);
        return [emptyYear];
      }
      if (selectedYear === yearToDelete) {
        const nextSelected = remaining[remaining.length - 1].year;
        setSelectedYear(nextSelected);
      }
      return remaining;
    });
    showToast(`Año ${yearToDelete} eliminado`);
  };

  // User Action: Delete/clear single month
  const handleDeleteMonth = (year: number, month: number) => {
    isLocallyModifiedRef.current = true;
    setYearsData((prev) =>
      prev.map((y) => {
        if (y.year !== year) return y;
        return {
          ...y,
          months: y.months.map((m) => {
            if (m.month !== month) return m;
            return {
              ...m,
              platforms: [],
              otherFunds: [],
              notes: '',
              hasData: false,
              isClosed: false,
            };
          }),
        };
      })
    );
    showToast(`Datos de ${MONTH_NAMES_ES[month - 1]} ${year} eliminados`);
  };

  // User Action: Reset to generic demo initial template
  const handleResetData = () => {
    isLocallyModifiedRef.current = true;
    const key = getStorageKey(account?.userId);
    localStorage.removeItem(key);
    setYearsData(INITIAL_YEARS_DATA);
    const maxYear = Math.max(...INITIAL_YEARS_DATA.map((y) => y.year));
    setSelectedYear(maxYear);
    setSelectedMonth(1);
    showToast('Datos de ejemplo cargados correctamente');
  };

  // User Action: Clear all data completely (empty portfolio)
  const handleClearAllData = () => {
    isLocallyModifiedRef.current = true;
    const currentYr = new Date().getFullYear();
    const cleanYear: YearData = {
      year: currentYr,
      months: Array.from({ length: 12 }, (_, i) => ({
        id: `${currentYr}-${String(i + 1).padStart(2, '0')}`,
        year: currentYr,
        month: i + 1,
        monthName: MONTH_NAMES_ES[i],
        platforms: [],
        hasData: false,
        isClosed: false,
      })),
    };
    setYearsData([cleanYear]);
    setSelectedYear(currentYr);
    setSelectedMonth(1);
    const key = getStorageKey(account?.userId);
    localStorage.setItem(key, JSON.stringify([cleanYear]));
    showToast('Cartera vaciada. Puedes empezar a registrar datos desde cero.');
  };

  const handleImportData = (imported: YearData[]) => {
    isLocallyModifiedRef.current = true;
    setYearsData(imported);
    if (imported.length > 0) {
      setSelectedYear(imported[imported.length - 1].year);
      setSelectedMonth(1);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white pb-8 relative overflow-x-hidden">
      {/* Financial Blueprint Background Wallpaper (Fixed across all pages) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url(${investmentBg})`,
        }}
      />
      {/* Deep atmospheric overlay layer for optimal contrast and text legibility */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-slate-950/50 backdrop-blur-[1px]" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-purple-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200">
          <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Header */}
      <div className="relative z-40">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          yearsData={yearsData}
          onResetData={handleResetData}
          onClearAllData={handleClearAllData}
          onImportData={handleImportData}
          account={account}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onForceSaveCloud={handleForceSaveCloud}
          onReloadFromCloud={handleReloadFromCloud}
          onShowToast={showToast}
        />
      </div>

      {/* Main Content Area (Floating Cards Layout) */}
      <main className="relative z-10 flex-1 mx-auto max-w-7xl w-full px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">
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
            onDeleteYear={handleDeleteYear}
            onDeleteMonth={handleDeleteMonth}
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
      />
    </div>
  );
}
