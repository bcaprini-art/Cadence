import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { mockRoster, mockEvents } from '../../lib/mock';
import { format, parseISO } from 'date-fns';
import SportHeroBanner from '../../components/SportHeroBanner';

const GAME_COLORS = 'bg-red-500/20 text-red-300 border-red-500/30';
const TRAVEL_COLORS = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
const FILM_COLORS = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
const MEETING_COLORS = 'bg-gray-500/20 text-gray-300 border-gray-500/30';

function getEventCardStyle(event, theme) {
  if (event.type === 'GAME') return { className: `border ${GAME_COLORS}` };
  if (event.type === 'TRAVEL') return { className: `border ${TRAVEL_COLORS}` };
  if (event.type === 'FILM') return { className: `border ${FILM_COLORS}` };
  if (event.type === 'MEETING') return { className: `border ${MEETING_COLORS}` };
  // PRACTICE — use sport theme
  return {
    className: 'border',
    style: {
      backgroundColor: `${theme.primary}18`,
      borderColor: `${theme.primary}40`,
      color: 'white',
    },
  };
}

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const atRisk = mockRoster.filter(a => a.cara_hours / a.cara_limit >= 0.85);
  const upcoming = [...mockEvents].sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <header
        className="border-b border-white/10 px-6 py-4 relative overflow-hidden"
        style={{ background: theme.gradient }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: theme.heroPattern }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-black text-sm"
              style={{ backgroundColor: theme.primary }}
            >
              C
            </div>
            <span className="text-xl font-bold">Cadence</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <button onClick={() => navigate('/dashboard')} className={`font-medium ${theme.accentClass}`}>Dashboard</button>
            <button onClick={() => navigate('/team-availability')} className="hover:text-white">Availability</button>
            <button onClick={() => navigate('/schedule-event')} className="hover:text-white">Schedule</button>
            <button onClick={() => navigate('/roster')} className="hover:text-white">Roster</button>
            <button onClick={() => navigate('/compliance')} className="hover:text-white">Compliance</button>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Sport Hero Banner */}
        <SportHeroBanner />

        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Good morning, {user?.name?.split(' ')[1] || user?.name}{' '}
            <span title={user?.sport}>{theme.icon}</span>
          </h1>
          <p className="text-gray-400 mt-1">{user?.sport} · {user?.school}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Schedule Practice', icon: '📅', path: '/schedule-event' },
            { label: 'View Heatmap', icon: '🔥', path: '/team-availability' },
            { label: 'Roster', icon: '👥', path: '/roster' },
            { label: 'Compliance', icon: '📋', path: '/compliance' },
          ].map((a, i) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="rounded-xl p-4 text-left transition-all hover:opacity-90"
              style={i === 0 ? {
                background: `linear-gradient(135deg, ${theme.primary}55, ${theme.secondary}33)`,
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-sm font-medium">{a.label}</div>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="md:col-span-2 bg-[#0d1526] rounded-xl border border-white/10 p-5">
            <h2 className="font-semibold text-gray-200 mb-4">Upcoming This Week</h2>
            <div className="space-y-3">
              {upcoming.map(e => {
                const cardStyle = getEventCardStyle(e, theme);
                return (
                  <div
                    key={e.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${cardStyle.className}`}
                    style={cardStyle.style}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate flex items-center gap-1.5">
                        {e.type === 'PRACTICE' && (
                          <span className="text-base" title={`${e.type}`}>{theme.icon}</span>
                        )}
                        {e.title}
                      </p>
                      <p className="text-xs opacity-70">{format(parseISO(e.start), 'EEE, MMM d · h:mm a')} · {e.venue?.name}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 flex-shrink-0">{e.type}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => navigate('/schedule-event')}
              className="mt-4 w-full py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition-colors">
              + Schedule New Event
            </button>
          </div>

          {/* CARA Alerts */}
          <div className="bg-[#0d1526] rounded-xl border border-white/10 p-5">
            <h2 className="font-semibold text-gray-200 mb-1">CARA Alerts</h2>
            <p className="text-xs text-gray-500 mb-4">Athletes near weekly limit</p>
            {atRisk.length === 0 ? (
              <p className={`text-sm ${theme.accentClass}`}>✓ All athletes within limits</p>
            ) : (
              <div className="space-y-3">
                {atRisk.map(a => {
                  const pct = Math.round((a.cara_hours / a.cara_limit) * 100);
                  return (
                    <div key={a.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{a.name.split(' ')[0]}</span>
                        <span className={pct >= 95 ? 'text-red-400' : 'text-yellow-400'}>{a.cara_hours}h / {a.cara_limit}h</span>
                      </div>
                      <div className="bg-white/10 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${pct >= 95 ? 'bg-red-500' : 'bg-yellow-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => navigate('/compliance')}
                  className={`text-xs hover:underline mt-2 ${theme.accentClass}`}>View full compliance →</button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-2">Team Overview</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-xl font-bold text-white">{mockRoster.length}</div>
                  <div className="text-xs text-gray-500">Athletes</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-xl font-bold text-yellow-400">{atRisk.length}</div>
                  <div className="text-xs text-gray-500">At Risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
