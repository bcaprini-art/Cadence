import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const athleteNav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-schedule', label: 'My Schedule' },
  { to: '/team-schedule', label: 'Team Schedule' },
];

const coachNav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/team-availability', label: 'Availability' },
  { to: '/schedule-event', label: 'Schedule Event' },
  { to: '/roster', label: 'Roster' },
  { to: '/compliance', label: 'Compliance' },
];

export default function Header() {
  const { user, logout, isCoach } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = isCoach ? coachNav : athleteNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1e] border-b border-slate-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <span className="font-bold text-white text-sm">Cadence</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-white leading-tight">{user.name}</span>
            <span className="text-xs text-slate-400 capitalize">{user.role} · {user.sport}</span>
          </div>
          <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 font-bold text-sm">
            {user.name[0]}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            Sign out
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white ml-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-[#0a0f1e] px-4 py-2">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium mb-1 ${
                  isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white mt-1"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
