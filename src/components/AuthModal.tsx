import React, { useState } from 'react';
import {
  Cloud,
  X,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Mail,
  UserPlus,
  LogIn,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { UserAccount, YearData } from '../types/investment';
import { registerUserAccount, loginUserAccount } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: UserAccount, loadedData?: YearData[]) => void;
  currentYearsData: YearData[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentYearsData,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = emailOrUser.trim();
    if (!identifier) {
      setError('Por favor introduce tu correo o nombre de usuario.');
      return;
    }
    if (!password || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const { user, yearsData } = await registerUserAccount(
          identifier,
          password,
          displayName.trim() || undefined,
          currentYearsData
        );
        onSuccess(user, yearsData);
        onClose();
      } else {
        const { user, yearsData } = await loginUserAccount(identifier, password);
        onSuccess(user, yearsData || undefined);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'Error al conectar con la base de datos.');
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
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Cloud className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Iniciar Sesión en la Nube' : 'Crear Cuenta de Inversión'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sincroniza y comparte tus inversiones entre tu móvil Android, tablet y PC.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition cursor-pointer ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition cursor-pointer ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tu Nombre o Apodo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. Fernando"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Correo o Usuario
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                placeholder="Ej. ferjrm@gmail.com o fernando"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {mode === 'login'
                ? 'Introduce el usuario o correo que usaste al registrarte.'
                : 'Usa este mismo correo o usuario para iniciar sesión en tu Android o PC.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Multi-device benefits */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3 text-xs text-indigo-200/90 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-indigo-300">
              <div className="flex items-center gap-1 text-indigo-400">
                <Smartphone className="h-3.5 w-3.5" />
                <Laptop className="h-3.5 w-3.5" />
              </div>
              <span>Sincronización multidispositivo</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {mode === 'register'
                ? 'Al crear tu cuenta se subirá tu cartera actual a la base de datos en la nube.'
                : 'Al iniciar sesión se descargarán automáticamente tus inversiones actualizadas.'}
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
                <span>{mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>{mode === 'login' ? 'Iniciar Sesión y Sincronizar' : 'Crear Cuenta y Guardar en Nube'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-3 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-slate-400">
              ¿No tienes cuenta aún?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
              >
                Crear una nueva cuenta
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
