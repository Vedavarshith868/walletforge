import { createContext, createElement, useCallback, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'walletforge.session';

function readSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const signIn = useCallback((data) => {
    const next = { token: data.token, user: data.user, organization: data.organization };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  return createElement(AuthContext.Provider, { value: { session, signIn, signOut } }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
