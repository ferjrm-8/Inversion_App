import React, { useEffect, useState, useRef, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Header } from './components/Header';
import { DataEntryTab } from './components/DataEntryTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AuthModal } from './components/AuthModal';
import { OtherFundItem, PlatformRecord, YearData } from './types/investment';
import { INITIAL_YEARS_DATA, MONTH_NAMES_ES } from './data/initialData';
import { auth, logoutUser, saveUserPortfolio, subscribeUserPortfolio } from './firebase';

// Storage key generator
const getStorageKey = (uid?: string) =>
  uid ? `mis_inversiones_app_user_${uid}` : 'mis_inversiones_app_data_guest_v1';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>('local');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [yearsData, setYearsData] = useState<YearData[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey());
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

  // Ref to prevent initial local save loop when cloud loads
  const isCloudLoadingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show temporary toast message
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Listen to Auth state changes
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);

      if (currentUser) {
        setSyncStatus('syncing');
        isCloudLoadingRef.current = true;

        // Try reading cached data for this specific user first
        const userKey = getStorageKey(currentUser.uid);
        const cached = localStorage.getItem(userKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.months) {
              setYearsData(parsed);
            }
          } catch (e) {
            console.warn('Error loading user local cache', e);
          }
        }

        // Subscribe to real-time updates from Firestore for this user
        unsubscribeFirestore = subscribeUserPortfolio(
          currentUser.uid,
          (cloudYearsData) => {
            if (cloudYearsData && cloudYearsData.length > 0) {
              isCloudLoadingRef.current = true;
              setYearsData(cloudYearsData);
              localStorage.setItem(userKey, JSON.stringify(cloudYearsData));
              setSyncStatus('synced');
              setTimeout(() => {
                isCloudLoadingRef.current = false;
              }, 500);
            }
          },
          (err) => {
            console.error('Firestore subscription error:', err);
            setSyncStatus('offline');
            isCloudLoadingRef.current = false;
          }
        );

        // If first time or new user in cloud, upload current data after a brief delay
        setTimeout(async () => {
          isCloudLoadingRef.current = false;
        }, 1200);
      } else {
        // User logged out -> Switch back to local guest storage
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setSyncStatus('local');
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
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Save changes locally and sync with Firestore if logged in
  useEffect(() => {
    const storageKey = getStorageKey(user?.uid);
    try {
      localStorage.setItem(storageKey, JSON.stringify(yearsData));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }

    if (!user || isCloudLoadingRef.current) return;

    // Debounce cloud saving by 1.2s to prevent excessive writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus('syncing');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveUserPortfolio(user.uid, yearsData);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Cloud save failed:', err);
        setSyncStatus('offline');
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [yearsData, user]);

  // Force manual cloud save
  const handleForceSaveCloud = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      await saveUserPortfolio(user.uid, yearsData);
      setSyncStatus('synced');
      showToast('Datos guardados en la nube con éxito');
    } catch (err) {
      console.error(err);
      setSyncStatus('offline');
      showToast('Error al conectar con la nube');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSyncStatus('local');
    // Load default template for guest
    setYearsData(INITIAL_YEARS_DATA);
    setSelectedYear(2026);
    setSelectedMonth(9);
    showToast('Has cerrado sesión correctamente');
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
    const key = getStorageKey(user?.uid);
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
        user={user}
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
        onSuccess={() => {
          showToast('Sesión iniciada con éxito. Datos sincronizados.');
        }}
      />
    </div>
  );
}
