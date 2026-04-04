/**
 * Cadence Mobile — Auth Context
 * Uses AsyncStorage (not localStorage) for persistence.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../services/api';
import * as authService from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSchool = useCallback(async schoolId => {
    if (!schoolId) return;
    try {
      const {data} = await api.get(`/schools/${schoolId}`);
      setSchool(data);
    } catch {
      // Non-fatal
    }
  }, []);

  // Rehydrate session on app start
  useEffect(() => {
    const init = async () => {
      try {
        const [token, savedUser] = await Promise.all([
          authService.getToken(),
          authService.getUser(),
        ]);
        if (token && savedUser) {
          setUser(savedUser);
          fetchSchool(savedUser.schoolId);
        }
      } catch {
        // Corrupted storage — start fresh
        await authService.clearSession();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchSchool]);

  const login = useCallback(
    async (email, password) => {
      const data = await authService.login(email, password);
      setUser(data.user);
      fetchSchool(data.user.schoolId);
      return data.user;
    },
    [fetchSchool],
  );

  const register = useCallback(
    async formData => {
      const data = await authService.register(formData);
      setUser(data.user);
      fetchSchool(data.user.schoolId);
      return data.user;
    },
    [fetchSchool],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setSchool(null);
  }, []);

  const refreshSchool = useCallback(() => {
    if (user?.schoolId) fetchSchool(user.schoolId);
  }, [user, fetchSchool]);

  const isCoach =
    user?.role === 'COACH' || user?.role === 'coach';
  const isAdmin =
    user?.role === 'AD' || user?.role === 'ADMIN';
  const isAthlete =
    user?.role === 'ATHLETE' || user?.role === 'athlete';

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        loading,
        login,
        register,
        logout,
        refreshSchool,
        isCoach,
        isAdmin,
        isAthlete,
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
