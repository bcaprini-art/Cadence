import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { mockUser, mockCoach } from '../lib/mock';

const AuthContext = createContext(null);

const USE_MOCK = false; // Backend is live

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSchool = useCallback(async (schoolId) => {
    if (!schoolId) return;
    try {
      const { data } = await api.get(`/schools/${schoolId}`);
      setSchool(data);
    } catch {
      // Non-fatal: school info unavailable
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('cadence_user');
    const token = localStorage.getItem('cadence_token');

    if (stored && token) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        fetchSchool(u.schoolId);
      } catch {
        localStorage.removeItem('cadence_user');
        localStorage.removeItem('cadence_token');
      }
    } else if (USE_MOCK) {
      // Auto-login with mock user for development — remove in prod
      // Don't auto-login; let user choose at /login
    }
    setLoading(false);
  }, [fetchSchool]);

  const login = useCallback(async (email, password) => {
    if (USE_MOCK) {
      // Mock login: "coach@" → coach role, otherwise athlete
      const mockU = email.includes('coach') ? mockCoach : mockUser;
      localStorage.setItem('cadence_token', 'mock-jwt-token');
      localStorage.setItem('cadence_user', JSON.stringify(mockU));
      setUser(mockU);
      return mockU;
    }

    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cadence_token', data.token);
    localStorage.setItem('cadence_user', JSON.stringify(data.user));
    setUser(data.user);
    fetchSchool(data.user.schoolId);
    return data.user;
  }, [fetchSchool]);

  const register = useCallback(async (formData) => {
    if (USE_MOCK) {
      const mockU = formData.role === 'coach' ? mockCoach : mockUser;
      const u = { ...mockU, name: formData.name, email: formData.email };
      localStorage.setItem('cadence_token', 'mock-jwt-token');
      localStorage.setItem('cadence_user', JSON.stringify(u));
      setUser(u);
      return u;
    }

    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('cadence_token', data.token);
    localStorage.setItem('cadence_user', JSON.stringify(data.user));
    setUser(data.user);
    fetchSchool(data.user.schoolId);
    return data.user;
  }, [fetchSchool]);

  const logout = useCallback(() => {
    localStorage.removeItem('cadence_token');
    localStorage.removeItem('cadence_user');
    setUser(null);
    setSchool(null);
  }, []);

  const refreshSchool = useCallback(() => {
    if (user?.schoolId) fetchSchool(user.schoolId);
  }, [user, fetchSchool]);

  const isCoach = user?.role === 'COACH' || user?.role === 'coach';
  const isAdmin = user?.role === 'AD' || user?.role === 'ADMIN';
  const isAthlete = user?.role === 'ATHLETE' || user?.role === 'athlete';

  return (
    <AuthContext.Provider value={{ user, school, loading, login, register, logout, refreshSchool, isCoach, isAdmin, isAthlete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
