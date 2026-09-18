import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserAccount, YearData } from './types/investment';

// Initialize Firebase App
export const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Configure Firestore instance
export const db =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)' &&
  firebaseConfig.firestoreDatabaseId !== ''
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

const ACTIVE_USER_STORAGE_KEY = 'mis_inversiones_active_user_session_v3';

/**
 * Normalizes an email or username to a valid Firestore document ID
 */
export function normalizeUserId(input: string): string {
  if (!input) return 'user-default';
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[@.]/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 64) || 'user-anonymous'
  );
}

/**
 * Simple hash helper for password storage
 */
function hashSecret(secret: string): string {
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}_${secret.length}`;
}

/**
 * Strips all undefined fields recursively so Firestore never throws unsupported field errors
 */
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Session storage helpers
 */
export function getStoredUserSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserAccount;
  } catch (e) {
    console.warn('Error reading stored user session', e);
    return null;
  }
}

export function setStoredUserSession(account: UserAccount): void {
  try {
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(account));
  } catch (e) {
    console.error('Error saving user session', e);
  }
}

export function clearStoredUserSession(): void {
  try {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing user session', e);
  }
}

/**
 * Registers a new user account in Firestore
 */
export async function registerUserAccount(
  emailOrUsername: string,
  password: string,
  displayName?: string,
  initialYearsData?: YearData[]
): Promise<{ user: UserAccount; yearsData: YearData[] }> {
  const cleanInput = emailOrUsername.trim();
  const userId = normalizeUserId(cleanInput);
  const name = displayName?.trim() || cleanInput.split('@')[0];

  if (!cleanInput) {
    throw new Error('Debes introducir un correo o nombre de usuario.');
  }
  if (!password || password.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }

  const userDocRef = doc(db, 'users', userId);
  const portfolioDocRef = doc(db, 'portfolios', userId);

  // Check if user already exists
  const existingUserSnap = await getDoc(userDocRef);
  if (existingUserSnap.exists()) {
    throw new Error('Este usuario o correo ya está registrado. Por favor, pulsa en "Iniciar Sesión".');
  }

  const userRecord = sanitizeForFirestore({
    userId,
    emailOrUsername: cleanInput,
    displayName: name,
    passwordHash: hashSecret(password),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  });

  await setDoc(userDocRef, userRecord);

  // If initial data is provided, save it as their initial portfolio
  const yearsToSave = initialYearsData && initialYearsData.length > 0 ? initialYearsData : [];
  if (yearsToSave.length > 0) {
    const portfolioRecord = sanitizeForFirestore({
      userId,
      displayName: name,
      yearsData: yearsToSave,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(portfolioDocRef, portfolioRecord);
  }

  const userAccount: UserAccount = {
    userId,
    emailOrUsername: cleanInput,
    displayName: name,
    lastSyncedAt: new Date().toISOString(),
  };

  setStoredUserSession(userAccount);
  return { user: userAccount, yearsData: yearsToSave };
}

/**
 * Logs in an existing user account from Firestore
 */
export async function loginUserAccount(
  emailOrUsername: string,
  password: string
): Promise<{ user: UserAccount; yearsData: YearData[] | null }> {
  const cleanInput = emailOrUsername.trim();
  const userId = normalizeUserId(cleanInput);

  if (!cleanInput) {
    throw new Error('Debes introducir tu correo o nombre de usuario.');
  }
  if (!password) {
    throw new Error('Debes introducir tu contraseña.');
  }

  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error('No existe ninguna cuenta con este usuario/correo. Pulsa en "Crear Cuenta" para registrarte.');
  }

  const userData = userSnap.data();
  const expectedHash = hashSecret(password);

  if (userData.passwordHash && userData.passwordHash !== expectedHash) {
    throw new Error('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
  }

  // Update last login
  await setDoc(
    userDocRef,
    { lastLoginAt: new Date().toISOString() },
    { merge: true }
  );

  // Load user's portfolio data from Firestore
  const portfolioDocRef = doc(db, 'portfolios', userId);
  const portfolioSnap = await getDoc(portfolioDocRef);

  let loadedYearsData: YearData[] | null = null;
  if (portfolioSnap.exists()) {
    const data = portfolioSnap.data();
    if (Array.isArray(data.yearsData) && data.yearsData.length > 0) {
      loadedYearsData = data.yearsData as YearData[];
    }
  }

  const userAccount: UserAccount = {
    userId,
    emailOrUsername: userData.emailOrUsername || cleanInput,
    displayName: userData.displayName || cleanInput,
    lastSyncedAt: new Date().toISOString(),
  };

  setStoredUserSession(userAccount);
  return { user: userAccount, yearsData: loadedYearsData };
}

/**
 * Saves portfolio to Firestore with complete sanitization
 */
export async function savePortfolioToCloud(
  userId: string,
  yearsData: YearData[],
  displayName?: string
): Promise<boolean> {
  try {
    const cleanUserId = normalizeUserId(userId);
    const docRef = doc(db, 'portfolios', cleanUserId);

    const payload = sanitizeForFirestore({
      userId: cleanUserId,
      displayName: displayName || cleanUserId,
      yearsData,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving portfolio to Firestore:', error);
    throw error;
  }
}

/**
 * Loads portfolio from Firestore
 */
export async function loadPortfolioFromCloud(
  userId: string
): Promise<{ yearsData: YearData[]; displayName?: string } | null> {
  try {
    const cleanUserId = normalizeUserId(userId);
    const docRef = doc(db, 'portfolios', cleanUserId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.yearsData) && data.yearsData.length > 0) {
        return {
          yearsData: data.yearsData as YearData[],
          displayName: data.displayName || cleanUserId,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading portfolio from Firestore:', error);
    throw error;
  }
}

/**
 * Real-time listener for Firestore portfolio changes across devices
 */
export function subscribePortfolioFromCloud(
  userId: string,
  onData: (yearsData: YearData[]) => void,
  onError?: (err: Error) => void
) {
  const cleanUserId = normalizeUserId(userId);
  const docRef = doc(db, 'portfolios', cleanUserId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.yearsData) && data.yearsData.length > 0) {
          onData(data.yearsData as YearData[]);
        }
      }
    },
    (err) => {
      console.warn('Portfolio subscription error:', err);
      if (onError) onError(err);
    }
  );
}
