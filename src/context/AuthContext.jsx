import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthChange, 
  loginWithGoogle as fbLoginWithGoogle, 
  loginWithEmail as fbLoginWithEmail, 
  registerWithEmail as fbRegisterWithEmail, 
  logoutUser as fbLogoutUser, 
  sendPasswordReset as fbSendPasswordReset,
  isFirebaseConfigured 
} from '../utils/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  isConfigured: false,
  syncStatus: 'offline',
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(isFirebaseConfigured ? 'synced' : 'unconfigured');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setSyncStatus('unconfigured');
      return;
    }

    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fbLoginWithGoogle();
      setUser(res.user);
      setSyncStatus('synced');
      return res.user;
    } catch (err) {
      setSyncStatus('offline');
      throw err;
    }
  };

  const loginWithEmail = async (email, password) => {
    setSyncStatus('syncing');
    try {
      const res = await fbLoginWithEmail(email, password);
      setUser(res.user);
      setSyncStatus('synced');
      return res.user;
    } catch (err) {
      setSyncStatus('offline');
      throw err;
    }
  };

  const registerWithEmail = async (email, password) => {
    setSyncStatus('syncing');
    try {
      const res = await fbRegisterWithEmail(email, password);
      setUser(res.user);
      setSyncStatus('synced');
      return res.user;
    } catch (err) {
      setSyncStatus('offline');
      throw err;
    }
  };

  const logout = async () => {
    await fbLogoutUser();
    setUser(null);
    setSyncStatus('offline');
  };

  const sendPasswordReset = async (email) => {
    return await fbSendPasswordReset(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        syncStatus,
        setSyncStatus,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        sendPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
