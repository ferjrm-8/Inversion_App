import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { CloudAccount, YearData } from './types/investment';

// Initialize Firebase App
export const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const ACTIVE_ACCOUNT_STORAGE_KEY = 'mis_inversiones_active_cloud_account_v2';

/**
 * Normalizes an account identifier or email to be a safe Firestore doc ID
 */
export function normalizeAccountId(input: string): string {
  if (!input) return 'default';
  return input
    .trim()
    .toLowerCase()
    .replace(/[@.]/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 64) || 'usuario';
}

/**
 * Local stored account helpers
 */
export function getStoredAccount(): CloudAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CloudAccount;
  } catch (e) {
    console.warn('Error reading stored cloud account', e);
    return null;
  }
}

export function setStoredAccount(account: CloudAccount): void {
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } catch (e) {
    console.error('Error saving active cloud account', e);
  }
}

export function clearStoredAccount(): void {
  try {
    localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing cloud account', e);
  }
}

/**
 * Saves a portfolio dataset directly to Firestore for the given account
 */
export async function savePortfolioToCloud(
  rawAccountId: string,
  yearsData: YearData[],
  displayName?: string,
  pin?: string
): Promise<boolean> {
  try {
    const accountId = normalizeAccountId(rawAccountId);
    const docRef = doc(db, 'portfolios', accountId);

    const payload: {
      accountId: string;
      displayName: string;
      yearsData: YearData[];
      updatedAt: string;
      pin?: string;
    } = {
      accountId,
      displayName: displayName || rawAccountId,
      yearsData,
      updatedAt: new Date().toISOString(),
    };

    if (pin && pin.trim()) {
      payload.pin = pin.trim();
    }

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving portfolio to Firestore:', error);
    throw error;
  }
}

/**
 * Loads a portfolio dataset from Firestore
 */
export async function loadPortfolioFromCloud(
  rawAccountId: string
): Promise<{ yearsData: YearData[]; displayName?: string; pin?: string } | null> {
  try {
    const accountId = normalizeAccountId(rawAccountId);
    const docRef = doc(db, 'portfolios', accountId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.yearsData) && data.yearsData.length > 0) {
        return {
          yearsData: data.yearsData as YearData[],
          displayName: data.displayName || rawAccountId,
          pin: data.pin,
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
 * Real-time listener for Firestore portfolio changes
 */
export function subscribePortfolioFromCloud(
  rawAccountId: string,
  onData: (yearsData: YearData[]) => void,
  onError?: (err: Error) => void
) {
  const accountId = normalizeAccountId(rawAccountId);
  const docRef = doc(db, 'portfolios', accountId);

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

/**
 * Firebase Auth standard helpers
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logoutFirebaseAuth(): Promise<void> {
  await signOut(auth);
}
