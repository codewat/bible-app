import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// Get config from Vite environment variables or locally saved override
export function getFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // Check if user entered config in the app
  try {
    const custom = localStorage.getItem('catholic_bible_custom_firebase_config');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading custom firebase config:', e);
  }

  return null;
}

export function saveCustomFirebaseConfig(config) {
  try {
    localStorage.setItem('catholic_bible_custom_firebase_config', JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error('Failed to save firebase config:', e);
  }
}

export function clearCustomFirebaseConfig() {
  try {
    localStorage.removeItem('catholic_bible_custom_firebase_config');
    window.location.reload();
  } catch (e) {
    console.error('Failed to clear firebase config:', e);
  }
}

const config = getFirebaseConfig();
export const isFirebaseConfigured = Boolean(config && config.apiKey && config.projectId);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { app, auth, db, googleProvider };

// Authentication Helpers
export async function loginWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Authentication is not configured yet. Please provide Firebase credentials.');
  }
  return await signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured yet.');
  }
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured yet.');
  }
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  if (!auth) return;
  return await signOut(auth);
}

export async function sendPasswordReset(email) {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured yet.');
  }
  return await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Cloud Database Sync Helpers
export async function fetchCloudUserData(userId) {
  if (!db || !userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('Error fetching cloud user data:', err);
  }
  return null;
}

export async function saveCloudUserData(userId, { bookmarks, highlights, notes }) {
  if (!db || !userId) return;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        bookmarks: bookmarks || {},
        highlights: highlights || {},
        notes: notes || {},
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error saving cloud user data:', err);
  }
}

export function subscribeToCloudUserData(userId, onDataUpdate) {
  if (!db || !userId) return () => {};
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onDataUpdate(data);
      }
    },
    (error) => {
      console.warn('Firestore subscription error:', error);
    }
  );
}
