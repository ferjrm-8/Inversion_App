import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { YearData } from './types/investment';

// Initialize Firebase
export const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Google Provider
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const loginWithEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string, name?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred;
};

// Save user portfolio to Firestore
export const saveUserPortfolio = async (userId: string, yearsData: YearData[]) => {
  try {
    const docRef = doc(db, 'users', userId, 'portfolio', 'data');
    await setDoc(
      docRef,
      {
        yearsData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving portfolio to Firestore:', error);
    throw error;
  }
};

// Load user portfolio from Firestore
export const loadUserPortfolio = async (userId: string): Promise<YearData[] | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'portfolio', 'data');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.yearsData) && data.yearsData.length > 0) {
        return data.yearsData as YearData[];
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading portfolio from Firestore:', error);
    return null;
  }
};

// Subscribe to real-time updates from Firestore
export const subscribeUserPortfolio = (
  userId: string,
  onData: (yearsData: YearData[]) => void,
  onError?: (err: Error) => void
) => {
  const docRef = doc(db, 'users', userId, 'portfolio', 'data');
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
};
