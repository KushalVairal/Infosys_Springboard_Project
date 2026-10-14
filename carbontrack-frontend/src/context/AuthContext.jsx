import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ct_user');
    const token = localStorage.getItem('ct_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  // Tolerates different backend response shapes:
  // { token, user } | { accessToken, username, ... } | { jwt, ... }
  const persist = (data) => {
    const token = data.token || data.accessToken || data.jwt;
    if (!token) throw new Error('Login response did not contain a token');
    const u = data.user || {
      id: data.id ?? data.userId,
      username: data.username,
      email: data.email,
    };
    localStorage.setItem('ct_token', token);
    localStorage.setItem('ct_user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (credentials) => persist(await authApi.login(credentials));
  const register = async (payload) => persist(await authApi.register(payload));

  const logout = () => {
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
