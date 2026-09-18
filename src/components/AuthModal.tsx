import React, { useState } from 'react';
import { Cloud, X, Lock, User as UserIcon, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
  const [accountInput, setAccountInput] = useState(currentAccount?.displayName || '');
  const [pinInput, setPinInput] = useState(currentAccount?.pin || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = accountInput.trim();
    if (!name) {
      setError('Por favor introduce un nombre o correo para identificar tu cartera.');
      return;
    }

    setLoading(true);

    try {
      const normalizedId = normalizeAccountId(name);
      const existing = await loadPortfolioFromCloud(normalizedId);

      if (existing) {
        // If account has a PIN set, verify it
        if (existing.pin && existing.pin !== pinInput.trim()) {
          setError('El PIN o clave introducida es incorrecta para esta cartera.');
          setLoading(false);
          return;
        }

        const cloudAccount: CloudAccount = {
          accountId: normalizedId,
          displayName: existing.displayName || name,
          pin: pinInput.trim() || undefined,
          lastSyncedAt: new Date().toISOString(),
        };

        setStoredAccount(cloudAccount);
        onSuccess(cloudAccount, existing.yearsData);
        onClose();
      } else {
        // New account: create in cloud with current portfolio data
        const cloudAccount: CloudAccount = {
          accountId: normalizedId,
          displayName: name,
          pin: pinInput.trim() || undefined,
          lastSyncedAt: new Date().toISOString(),
        };

        await savePortfolioToCloud(
          normalizedId,
          currentYearsData,
          name,
          pinInput.trim() || undefined
        );

        setStoredAccount(cloudAccount);
        onSuccess(cloudAccount);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con la base de datos en la nube. Comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Cloud className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Conectar Cartera en la Nube
          </h2>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Sincroniza tus inversiones en tiempo real entre tu móvil, tablet y ordenador de forma automática y privada.
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
              Nombre de Usuario, Cartera o Correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder="Ej. Fernando o ferjrm@gmail.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Usa este mismo nombre en tus otros dispositivos para sincronizar automáticamente.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                PIN o Clave de Seguridad <span className="text-slate-500 font-normal">(Opcional)</span>
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Opcional (Ej. 1234)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Si defines un PIN, solo quien lo conozca podrá acceder a esta cartera.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3 text-xs text-indigo-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Autoguardado automático en la nube</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Cualquier cambio que hagas (añadir plataformas, modificar importes, cerrar meses) se guardará al instante.
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
                <span>Conectar y Sincronizar Cartera</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
