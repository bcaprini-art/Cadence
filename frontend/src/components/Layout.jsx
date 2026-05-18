import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import { requestNotificationPermission, setupForegroundListener, isConfigured } from '../lib/firebase';

const athleteNav = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/my-schedule', label: 'My Schedule', icon: '📅' },
  { path: '/appointments', label: 'Appointments', icon: '📅' },
  { path: '/todo', label: 'To-Do', icon: '✅' },
  { path: '/inbox', label: 'Inbox', icon: '🔔' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const coachNav = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/team-availability', label: 'Availability', icon: '🔥' },
  { path: '/schedule-event', label: 'Schedule Event', icon: '📅' },
  { path: '/roster', label: 'Roster', icon: '👥' },
  { path: '/teacher-portal', label: 'Grades', icon: '📚' },
  { path: '/travel', label: 'Travel', icon: '✈️' },
  { path: '/compliance', label: 'Compliance', icon: '📋' },
  { path: '/cara-forecast', label: 'CARA Forecast', icon: '📊' },
];

const adminNav = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: '🏛️' },
  { path: '/admin/schools', label: 'Schools', icon: '🏫' },
  { path: '/admin/compliance', label: 'Compliance', icon: '📋' },
  { path: '/admin/venues', label: 'Venues', icon: '🏟️' },
  { path: '/admin/settings', label: 'School Settings', icon: '⚙️' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';

function SchoolLogo({ school, theme }) {
  const [imgError, setImgError] = useState(false);

  if (school?.logoUrl && !imgError) {
    return (
      <img
        src={`${API_BASE}${school.logoUrl}`}
        alt={school.name}
        className="w-8 h-8 rounded-lg object-contain bg-white/5"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
      style={{ backgroundColor: theme.primary }}
    >
      C
    </div>
  );
}

export default function Layout({ children }) {
  const { user, school, logout, isCoach } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'AD' || user?.role === 'ADMIN';
  const navItems = isAdmin ? adminNav : isCoach ? coachNav : athleteNav;
  const notifInitialized = useRef(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Set up Firebase foreground listener once per session
  useEffect(() => {
    if (notifInitialized.current || !user) return;
    notifInitialized.current = true;

    setupForegroundListener();

    // Show prompt to enable notifications if Firebase is configured and permission not yet decided
    if (isConfigured && 'Notification' in window && Notification.permission === 'default') {
      setShowNotifPrompt(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Top Header — sport-themed gradient */}
      <header
        className="border-b border-white/10 px-6 py-3 flex-shrink-0 relative overflow-hidden"
        style={{ background: theme.gradient }}
      >
        {/* Subtle sport-specific pattern overlay */}
        {theme.pattern !== 'default' && (
          <div
            className="absolute inset-0 opacity-100 pointer-events-none"
            style={{ background: theme.heroPattern }}
            aria-hidden="true"
          />
        )}

        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          {/* Logo */}
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5">
            <SchoolLogo school={school} theme={theme} />
            <span className="text-lg font-bold tracking-tight">
              {school?.name || 'Cadence'}
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? `bg-white/10 ${theme.accentClass}`
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User + Notifications */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white leading-tight flex items-center gap-1 justify-end">
                {user?.name}
                {theme.icon && theme.icon !== '🏆' && (
                  <span className="text-base" title={user?.sport}>{theme.icon}</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{user?.role} · {user?.sport || 'Cadence'}</p>
            </div>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Notification permission banner */}
      {showNotifPrompt && (
        <div
          className="border-b border-white/10 px-6 py-2.5 flex items-center justify-between gap-4"
          style={{ background: `${theme.primary}15` }}
        >
          <p className="text-sm" style={{ color: theme.primary }}>
            🔔 Enable push notifications to get real-time schedule alerts
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={async () => {
                setShowNotifPrompt(false);
                await requestNotificationPermission();
              }}
              className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors text-black"
              style={{ backgroundColor: theme.primary }}
            >
              Enable
            </button>
            <button
              onClick={() => setShowNotifPrompt(false)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden border-t border-white/10 flex justify-around py-2 flex-shrink-0"
        style={{ background: theme.gradient }}>
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg text-xs transition-colors ${
              location.pathname === item.path ? theme.accentClass : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
