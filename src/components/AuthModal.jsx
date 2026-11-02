import React, { useState } from 'react';
import { 
  X, LogIn, UserPlus, Cloud, Check, AlertCircle, 
  Key, LogOut, Mail, Lock, Sparkles, RefreshCw, Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  saveCustomFirebaseConfig, 
  clearCustomFirebaseConfig, 
  isFirebaseConfigured 
} from '../utils/firebase';

export default function AuthModal({ isOpen, onClose }) {
  const { 
    user, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    logout, 
    sendPasswordReset 
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customConfigText, setCustomConfigText] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        await registerWithEmail(email, password);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSuccessMsg('Password reset link sent! Check your email inbox.');
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Authentication error.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = () => {
    setError('');
    try {
      // Allow pasting either raw JSON or JS object format
      let cleaned = customConfigText.trim();
      if (cleaned.startsWith('const firebaseConfig =') || cleaned.startsWith('var firebaseConfig =')) {
        cleaned = cleaned.replace(/^(const|var|let)\s+firebaseConfig\s*=\s*/, '').replace(/;\s*$/, '');
      }
      // Replace unquoted keys if necessary
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      const parsed = JSON.parse(cleaned);

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must contain apiKey and projectId.');
      }

      saveCustomFirebaseConfig(parsed);
    } catch (err) {
      setError('Invalid Firebase config JSON. Please check and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#1a1917] rounded-3xl shadow-2xl border border-amber-900/10 dark:border-amber-500/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/60 dark:bg-neutral-900/40 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-2xl shadow-xs mb-3">
            ✝️
          </div>
          <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
            Catholic Bible Account
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            Access your bookmarks, reflections, and notes on your phone, tablet, and computer.
          </p>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* If already logged in */}
          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center space-x-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || user.email} 
                    className="w-12 h-12 rounded-full border-2 border-amber-500" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-lg">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {user.displayName || 'Catholic Bible Reader'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {user.email}
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cloud Sync Active</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-amber-900 dark:text-amber-200">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>Cross-Device Bookmark Sync</span>
                </div>
                <p className="leading-relaxed">
                  Every time you save a bookmark, highlight, or reflection note on this device, it is automatically saved to your cloud account.
                </p>
                <p className="leading-relaxed text-[11px] text-neutral-500">
                  Just log in with this account on any other phone or browser to see all your saved verses!
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={async () => {
                    await logout();
                  }}
                  className="w-full py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : !isFirebaseConfigured ? (
            /* If Firebase is not yet configured with API Keys */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 text-xs space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-200">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Connect Firebase for Multi-Device Sync</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Para ma-save ang imong bookmarks sa cloud ug ma-access sa lain-laing phone ug computer, kinahanglan nato i-connect ang imong libreng <strong>Firebase Project</strong>.
                </p>
                <div className="bg-white/80 dark:bg-neutral-900/60 p-3 rounded-xl border border-amber-200 dark:border-neutral-800 space-y-1.5 text-[11px]">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-200">Sayon ra kaayo i-setup:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-neutral-600 dark:text-neutral-400">
                    <li>Adto sa <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-700 underline font-semibold">Firebase Console</a> ug pag-create ug libreng project.</li>
                    <li>I-enable ang <strong>Google Sign-In</strong> sa Authentication.</li>
                    <li>I-enable ang <strong>Cloud Firestore</strong> database.</li>
                    <li>Kopyaha ang imong Firebase Web Config ug i-paste sa ubos:</li>
                  </ol>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Paste Firebase Config JSON:
                </label>
                <textarea
                  value={customConfigText}
                  onChange={(e) => setCustomConfigText(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                  rows={5}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-mono text-[11px] focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition"
                >
                  Save & Enable Cloud Sync
                </button>
              </div>

              <p className="text-[11px] text-center text-neutral-400">
                O pwede pud nimo i-add sa imong Vercel Project Environment Variables (<code className="font-mono">VITE_FIREBASE_API_KEY</code>, etc.)
              </p>
            </div>
          ) : (
            /* Normal Login / Register form when Firebase is configured */
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-medium text-xs sm:text-sm flex items-center justify-center space-x-2.5 shadow-xs transition active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="bg-white dark:bg-[#1a1917] px-3 text-[11px] text-neutral-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    mode === 'login'
                      ? 'bg-white dark:bg-neutral-700 text-amber-900 dark:text-amber-200 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    mode === 'register'
                      ? 'bg-white dark:bg-neutral-700 text-amber-900 dark:text-amber-200 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-amber-800 dark:text-amber-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center space-x-1.5">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </span>
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : mode === 'register' ? (
                    'Create Account & Sync'
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

