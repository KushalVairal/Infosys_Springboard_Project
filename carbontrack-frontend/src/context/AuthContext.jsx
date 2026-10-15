import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('carbontrack_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontrack_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontrack_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const prof = await api.users.getMe();
      setProfile(prof);
      localStorage.setItem('carbontrack_profile', JSON.stringify(prof));
      return prof;
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('carbontrack_token');
    localStorage.removeItem('carbontrack_user');
    localStorage.removeItem('carbontrack_profile');
  }, []);

  const login = useCallback(async (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('carbontrack_token', authToken);
    localStorage.setItem('carbontrack_user', JSON.stringify(authUser));

    try {
      const prof = await api.users.getMe();
      setProfile(prof);
      localStorage.setItem('carbontrack_profile', JSON.stringify(prof));
    } catch {
      // Profile can be fetched subsequently
    }
  }, []);

  const updateProfileState = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('carbontrack_profile', JSON.stringify(updatedProfile));
  }, []);

  // Hydrate on mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        await fetchProfile();
      }
      setLoading(false);
    }
    initAuth();
  }, [token, fetchProfile]);

  // Listen for 401 unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('carbontrack:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('carbontrack:unauthorized', handleUnauthorized);
  }, [logout]);

  const preferredUnit = profile?.preferredUnit || 'KG_CO2E';

  const value = {
    token,
    user,
    profile,
    loading,
    isAuthenticated: Boolean(token),
    preferredUnit,
    login,
    logout,
    refreshProfile: fetchProfile,
    updateProfileState
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
