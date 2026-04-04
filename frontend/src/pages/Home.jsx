import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mockRoster } from '../lib/mock';

const adminActions = [
  {
    path: '/admin/dashboard',
    icon: '🏛️',
    label: 'Admin Dashboard',
    desc: 'Overview of all schools, teams, athletes, and compliance alerts',
    color: 'from-indigo-600/30 to-blue-600/20 border-indigo-500/30 hover:border-indigo-400/50',
    badge: null,
  },
  {
    path: '/admin/compliance',
    icon: '📋',
    label: 'Compliance Overview',
    desc: 'Cross-sport CARA compliance — violations, warnings, and bulk export',
    color: 'from-green-600/30 to-emerald-600/20 border-green-500/30 hover:border-green-400/50',
    badge: null,
  },
  {
    path: '/admin/schools',
    icon: '🏫',
    label: 'Schools',
    desc: 'Browse all schools, teams, and rosters under your oversight',
    color: 'from-purple-600/30 to-violet-600/20 border-purple-500/30 hover:border-purple-400/50',
    badge: null,
  },
  {
    path: '/admin/venues',
    icon: '🏟️',
    label: 'Venues',
    desc: 'View venue availability and booking calendar across all facilities',
    color: 'from-orange-600/30 to-red-600/20 border-orange-500/30 hover:border-orange-400/50',
    badge: null,
  },
  {
    path: '/admin/settings',
    icon: '⚙️',
    label: 'School Settings',
    desc: 'Upload school logo, manage sports programs, and update school info',
    color: 'from-slate-600/30 to-gray-600/20 border-slate-500/30 hover:border-slate-400/50',
    badge: null,
  },
];

const coachActions = [
  {
    path: '/team-availability',
    icon: '🔥',
    label: 'Team Availability',
    desc: 'See who\'s free and when with the live heatmap',
    badge: null,
  },
  {
    path: '/schedule-event',
    icon: '📅',
    label: 'Schedule an Event',
    desc: 'Create practice, game, travel, or film sessions with conflict checking',
    badge: null,
  },
  {
    path: '/roster',
    icon: '👥',
    label: 'Roster',
    desc: 'View all athletes, positions, and availability status',
    badge: `${mockRoster.length} athletes`,
  },
  {
    path: '/compliance',
    icon: '📋',
    label: 'NCAA Compliance',
    desc: 'Monitor CARA hours, warnings, and violations per athlete',
    badge: `${mockRoster.filter(a => a.cara_hours / a.cara_limit >= 0.85).length} at risk`,
  },
  {
    path: '/cara-forecast',
    icon: '📊',
    label: 'CARA Forecast',
    desc: "Weekly CARA projections — see who's on track before scheduling more",
    color: 'from-cyan-600/30 to-blue-600/20 border-cyan-500/30 hover:border-cyan-400/50',
    badge: null,
  },
];

const athleteActions = [
  {
    path: '/my-schedule',
    icon: '📅',
    label: 'My Schedule',
    desc: 'View and manage your class, study, and personal blocks',
    badge: null,
  },
];

export default function Home() {
  const { user, isCoach, isAdmin } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const actions = isAdmin ? adminActions : isCoach ? coachActions : athleteActions;
  const atRisk = mockRoster.filter(a => a.cara_hours / a.cara_limit >= 0.85);

  // Build action card gradient using theme colors
  const sportCardGradient = `from-[${theme.primary}]/20 to-[${theme.secondary}]/10`;

  return (
    <div>
      {/* Welcome hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]}{' '}
          <span title={user?.sport}>{theme.icon}</span>
        </h1>
        <p className="text-gray-400 mt-1">
          {user?.role === 'AD' || user?.role === 'ADMIN'
            ? 'Athletic Director'
            : user?.role === 'COACH'
            ? 'Coach'
            : 'Athlete'}{' '}
          · {user?.sport || 'Cadence'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick stats (coach only) */}
      {isCoach && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { value: mockRoster.length, label: 'Athletes', color: 'text-white' },
            { value: `${(mockRoster.reduce((s,a) => s + a.cara_hours, 0) / mockRoster.length).toFixed(1)}h`, label: 'Avg CARA', color: 'text-blue-400' },
            { value: atRisk.length, label: 'CARA Warnings', color: atRisk.length > 0 ? 'text-yellow-400' : theme.accentClass },
            { value: mockRoster.filter(a => a.cara_hours >= a.cara_limit).length, label: 'Violations', color: 'text-red-400' },
          ].map(s => (
            <div
              key={s.label}
              className="bg-[#0d1526] rounded-xl p-4 text-center border"
              style={{ borderColor: `${theme.primary}30` }}
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Action cards */}
      <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${theme.accentClass}`}>
        What would you like to do?
      </h2>

      {isAdmin ? (
        /* Admin uses static color cards */
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {adminActions.map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`bg-gradient-to-br ${action.color} border rounded-2xl p-6 text-left transition-all hover:scale-[1.01] hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{action.icon}</span>
                {action.badge && (
                  <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-full">{action.badge}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{action.label}</h3>
              <p className="text-sm text-gray-400">{action.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        /* Sport-themed action cards */
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {actions.map((action, i) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="border rounded-2xl p-6 text-left transition-all hover:scale-[1.01] hover:shadow-lg"
              style={{
                background: i === 0
                  ? `linear-gradient(135deg, ${theme.primary}22 0%, ${theme.secondary}11 100%)`
                  : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                borderColor: i === 0 ? `${theme.primary}50` : 'rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{action.icon}</span>
                {action.badge && (
                  <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-full">{action.badge}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{action.label}</h3>
              <p className="text-sm text-gray-400">{action.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* CARA alert banner (coach) */}
      {isCoach && atRisk.length > 0 && (
        <button onClick={() => navigate('/compliance')}
          className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-left hover:bg-yellow-500/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-300">{atRisk.length} athlete{atRisk.length > 1 ? 's' : ''} near CARA limit</p>
                <p className="text-xs text-gray-400">{atRisk.map(a => a.name.split(' ')[0]).join(', ')} — review before scheduling more</p>
              </div>
            </div>
            <span className="text-gray-500 text-sm">→</span>
          </div>
        </button>
      )}
    </div>
  );
}
