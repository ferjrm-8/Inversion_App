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
} from 'lucide-react';
import { CloudAccount, YearData } from '../types/investment';
import {
  loadPortfolioFromCloud,
  savePortfolioToCloud,
  normalizeAccountId,
  setStoredAccount,
  loginWithGoogle,
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
  // Direct Sync fields
  const [accountName, setAccountName] = useState(currentAccount?.displayName || '');
  const [pin, setPin] = useState(currentAccount?.pin || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Direct Sync with Firestore
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = accountName.trim();
    if (!name) {
      setError('Por favor introduce un nombre o correo para identificar tu cartera.');
      return;
    }

    setLoading(true);

    try {
      const normalizedId = normalizeAccountId(name);
      const existing = await loadPortfolioFromCloud(normalizedId);

      if (existing) {
        if (existing.pin && existing.pin !== pin.trim()) {
          setError('El PIN de seguridad es incorrecto para esta cartera.');
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
      console.error(err);
      setError('No se pudo conectar con Firestore. Comprueba tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In (Enabled in Firebase project)
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        const normalizedId = normalizeAccountId(user.email || user.uid);
        const existing = await loadPortfolioFromCloud(normalizedId);

        const cloudAccount: CloudAccount = {
          accountId: normalizedId,
          displayName: user.displayName || user.email || 'Mi Usuario Google',
          lastSyncedAt: new Date().toISOString(),
        };

        if (existing) {
          setStoredAccount(cloudAccount);
          onSuccess(cloudAccount, existing.yearsData);
        } else {
          await savePortfolioToCloud(normalizedId, currentYearsData, cloudAccount.displayName);
          setStoredAccount(cloudAccount);
          onSuccess(cloudAccount);
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Ventana de inicio con Google cerrada antes de completar.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Tu navegador bloqueó la ventana emergente de Google. Usa el acceso por nombre abajo.');
      } else {
        setError('No se pudo iniciar con Google. Usa el acceso directo con tu nombre o correo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Cloud className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Conectar Cartera en la Nube
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Guarda y sincroniza tus inversiones en tiempo real entre tu móvil, tablet y PC.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Option 1: Continue with Google */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-4 text-xs font-semibold text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.54 0 2.89.55 3.96 1.45l2.96-2.96C17.13 1.81 14.74 1 12 1 7.39 1 3.44 3.61 1.54 7.42l3.65 2.83C6.07 7.23 8.79 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.69 2.86c2.16-1.99 3.73-4.94 3.73-8.68z"
              />
              <path
                fill="#FBBC05"
                d="M5.19 14.25c-.23-.68-.36-1.41-.36-2.25s.13-1.57.36-2.25L1.54 6.92C.56 8.87 0 11.08 0 13.5s.56 4.63 1.54 6.58l3.65-2.83z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.86c-1.08.73-2.46 1.16-4.24 1.16-3.21 0-5.93-2.23-6.81-5.25L1.54 15.97C3.44 19.78 7.39 23 12 23z"
              />
            </svg>
            <span>Iniciar Sesión con Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3.5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              o con tu nombre / correo
            </span>
          </div>
        </div>

        {/* Option 2: Direct Identification (Zero-friction Firestore Sync) */}
        <form onSubmit={handleDirectSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de Usuario o Correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ej. Fernando o ferjrm@gmail.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Escribe este mismo nombre en tu móvil para tener la misma cartera en ambos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              PIN de Seguridad <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Opcional (Ej. 1234)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Protege tu cartera si compartes dispositivo con otra persona.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-2.5 text-xs text-indigo-200/90 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Autoguardado automático en la nube</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Cualquier cambio de importes o plataformas se sincroniza al instante con Firestore.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Conectando con la nube...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Conectar y Sincronizar Cartera</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
