import { createContext, useContext, useEffect, useState } from 'react';
import { api, setCsrfToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function refreshSession() {
    const data = await api.bootstrap();
    setCsrfToken(data.csrf_token);
    setUser(data.user);
    return data;
  }

  useEffect(() => {
    // On load, fetch a fresh CSRF token and whatever session already exists
    // (e.g. the browser still has our httponly cookie from a previous visit).
    refreshSession()
      .catch(() => {
        setCsrfToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    setCsrfToken(data.csrf_token);
    setUser(data.user);
  }

  async function register(payload) {
    return api.register(payload);
  }

  async function verifyEmail(email, passcode) {
    const data = await api.verifyEmail(email, passcode);
    setCsrfToken(data.csrf_token);
    setUser(data.user);
    return data;
  }

  async function logout() {
    await api.logout();
    setUser(null);
    // Re-bootstrap to get a fresh anonymous CSRF token.
    await refreshSession();
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, verifyEmail, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
