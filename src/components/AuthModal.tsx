import React, { useState } from 'react';
import {
  Cloud,
  X,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CloudAccount, YearData } from '../types/investment';
import {
  loadPortfolioFromCloud,
  savePortfolioToCloud,
  normalizeAccountId,
  setStoredAccount,
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: CloudAccount, loadedData?: YearData[]) => void;
  currentYearsData: YearData[];
  currentAccount: CloudAccount | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentYearsData,
  currentAccount,
}) => {
  const [accountName, setAccountName] = useState(currentAccount?.displayName || '');
  const [pin, setPin] = useState(currentAccount?.pin || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = accountName.trim();
    if (!name) {
      setError('Por favor introduce tu nombre o correo para identificar tu cartera.');
      return;
    }

    setLoading(true);

    try {
      const normalizedId = normalizeAccountId(name);
      const existing = await loadPortfolioFromCloud(normalizedId);

      if (existing) {
        // If there is an existing portfolio with PIN, verify it
        if (existing.pin && existing.pin !== pin.trim()) {
          setError('El PIN de seguridad no coincide con esta cartera.');
          setLoading(false);
          return;
        }

        const cloudAccount: CloudAccount = {
          accountId: normalizedId,
          displayName: existing.displayName || name,
          pin: pin.trim() || undefined,
          lastSyncedAt: new Date().toISOString(),
        };

        setStoredAccount(cloudAccount);
        onSuccess(cloudAccount, existing.yearsData);
        onClose();
      } else {
        // First time creating this cloud account
        const cloudAccount: CloudAccount = {
          accountId: normalizedId,
          displayName: name,
          pin: pin.trim() || undefined,
          lastSyncedAt: new Date().toISOString(),
        };

        await savePortfolioToCloud(
          normalizedId,
          currentYearsData,
          name,
          pin.trim() || undefined
        );

        setStoredAccount(cloudAccount);
        onSuccess(cloudAccount);
        onClose();
      }
    } catch (err: any) {
      console.error('Error connecting to Firestore:', err);
      setError('No se pudo conectar con la base de datos en la nube. Revisa tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Cloud className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Sincronizar Cartera en la Nube
          </h2>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Conecta tu cartera directamente con la base de datos Firestore para tener tus datos compartidos en tiempo real en tu móvil, tablet y PC.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre de Usuario o Correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ej. Fernando o ferjrm@gmail.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Escribe este mismo nombre en tu móvil o en cualquier navegador para acceder a tus mismos datos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              PIN o Clave de Seguridad <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Opcional (Ej. 1234)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Si le cedes la app a otra persona, cada una usará su propio nombre y sus datos estarán completamente separados.
            </p>
          </div>

          {/* Real-time sync guarantee box */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-200/90 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Autoguardado en tiempo real activo</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Cualquier cambio de importes o plataformas se guarda al instante sin necesidad de botones manuales.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Conectando con la nube...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Conectar y Sincronizar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
