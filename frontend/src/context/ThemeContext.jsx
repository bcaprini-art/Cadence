import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getSportTheme } from '../lib/sportThemes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const theme = getSportTheme(user?.sport);

  // Apply CSS custom properties to :root so Tailwind arbitrary values work
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sport-primary', theme.primary);
    root.style.setProperty('--sport-secondary', theme.secondary);
    root.style.setProperty('--sport-gradient', theme.gradient);
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Return default theme if used outside provider (e.g. pre-login pages)
  if (!ctx) return getSportTheme(null);
  return ctx;
}
