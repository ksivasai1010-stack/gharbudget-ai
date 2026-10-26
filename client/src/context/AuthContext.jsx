import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await authAPI.me();
      setUser(data.user);
      setFamily(data.family);
      setRole(data.role);
    } catch {
      setUser(null);
      setFamily(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    // Handle unauthorized events
    window.addEventListener('auth:unauthorized', () => {
      setUser(null);
      setFamily(null);
      setRole(null);
    });
  }, [fetchMe]);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    setUser(data.user);
    setFamily(data.family);
    setRole(data.role);
    return data;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setFamily(null);
    setRole(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const setFamilyData = (familyData) => {
    setFamily(familyData);
    setRole('owner');
  };

  return (
    <AuthContext.Provider value={{
      user, family, role, loading,
      login, register, logout, updateUser, setFamilyData,
      isAuthenticated: !!user,
      isOwner: role === 'owner',
      canWrite: ['owner', 'adult'].includes(role),
      isDemo: user?.isDemo || false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
