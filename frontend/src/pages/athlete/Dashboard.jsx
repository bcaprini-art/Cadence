import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI, eventsAPI } from '../../lib/api';
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addDays,
} from 'date-fns';

// Non-practice colors stay consistent
const EVENT_TYPE_COLORS_STATIC = {
  GAME:     'border-l-red-500 bg-red-500/10',
  TRAVEL:   'border-l-yellow-500 bg-yellow-500/10',
  FILM:     'border-l-indigo-500 bg-indigo-500/10',
  MEETING:  'border-l-teal-500 bg-teal-500/10',
};

const EVENT_TYPE_BADGE = {
  PRACTICE: 'bg-green-500/20 text-green-400',
  GAME:     'bg-red-500/20 text-red-400',
  TRAVEL:   'bg-yellow-500/20 text-yellow-400',
  FILM:     'bg-indigo-500/20 text-indigo-400',
  MEETING:  'bg-teal-500/20 text-teal-400',
};

const BLOCK_COLORS = {
  CLASS:    'border-l-blue-500 bg-blue-500/10',
  STUDY:    'border-l-purple-500 bg-purple-500/10',
  PERSONAL: 'border-l-orange-500 bg-orange-500/10',
};

function TimeLabel({ iso }) {
  const d = parseISO(iso);
  if (isToday(d)) return <span className="text-green-400 font-medium">Today {format(d, 'h:mm a')}</span>;
  if (isTomorrow(d)) return <span className="text-blue-400">Tomorrow {format(d, 'h:mm a')}</span>;
  return <span className="text-slate-400">{format(d, 'EEE M/d h:mm a')}</span>;
}

export default function AthleteDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const now = new Date();

  const [blocks, setBlocks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch today's blocks + upcoming week of events in parallel
        const [blocksRes, eventsRes] = await Promise.all([
          scheduleAPI.getBlocks({
            start: startOfDay(now).toISOString(),
            end: addDays(endOfDay(now), 7).toISOString(),
          }),
          eventsAPI.getEvents({
            start: startOfDay(now).toISOString(),
            end: addDays(now, 7).toISOString(),
          }),
        ]);
        setBlocks(blocksRes.data);
        setEvents(eventsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const todayBlocks = blocks.filter((b) =>
    isWithinInterval(parseISO(b.start), { start: startOfDay(now), end: endOfDay(now) })
  );
  const todayEvents = events.filter((e) =>
    isWithinInterval(parseISO(e.start), { start: startOfDay(now), end: endOfDay(now) })
  );
  const upcoming = events
    .filter((e) => parseISO(e.start) > now)
    .sort((a, b) => parseISO(a.start) - parseISO(b.start))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-sm animate-pulse">Loading dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hey, {user?.name?.split(' ')[0]}{' '}
            <span title={user?.sport}>{theme.icon}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{format(now, 'EEEE, MMMM d')}{user?.sport ? ` · ${user.sport}` : ''}</p>
        </div>
        <Link
          to="/my-schedule"
          className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span>+ Add Block</span>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={todayEvents.length + todayBlocks.length} label="Events today" color={theme.accentClass} theme={theme} />
        <StatCard value={upcoming.length} label="Upcoming" color="text-blue-400" theme={theme} />
        <StatCard value={blocks.length} label="Blocks this week" color="text-yellow-400" theme={theme} />
        <StatCard value={0} label="Conflicts" color={theme.accentClass} theme={theme} />
      </div>

      {/* Today's schedule */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Today's Schedule</h2>
        {todayEvents.length === 0 && todayBlocks.length === 0 ? (
          <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-6 text-center">
            <p className="text-slate-400 text-sm">No events scheduled today</p>
            <Link to="/my-schedule" className="mt-2 inline-block text-sm text-green-400 hover:text-green-300">
              + Add a block
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {[...todayEvents, ...todayBlocks]
              .sort((a, b) => parseISO(a.start) - parseISO(b.start))
              .map((item) => {
                const isEvent = 'venue' in item || item.teamId;
                const isPractice = isEvent && item.type === 'PRACTICE';
                const staticColor = isEvent
                  ? EVENT_TYPE_COLORS_STATIC[item.type]
                  : BLOCK_COLORS[item.type] || 'border-l-slate-500 bg-slate-500/10';
                const colorClass = isPractice ? '' : (staticColor || 'border-l-slate-500 bg-slate-500/10');
                const practiceStyle = isPractice ? {
                  borderLeftColor: theme.primary,
                  backgroundColor: `${theme.primary}18`,
                } : {};
                const badgeClass = isEvent
                  ? EVENT_TYPE_BADGE[item.type] || 'bg-slate-500/20 text-slate-400'
                  : 'bg-slate-500/20 text-slate-400';

                return (
                  <div
                    key={item.id}
                    className={`border-l-4 rounded-r-xl px-4 py-3 ${colorClass}`}
                    style={practiceStyle}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm flex items-center gap-1.5">
                          {isPractice && <span className="text-base">{theme.icon}</span>}
                          {item.title || item.type}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(parseISO(item.start), 'h:mm a')} – {format(parseISO(item.end), 'h:mm a')}
                          {isEvent && item.venue?.name ? ` · ${item.venue.name}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badgeClass}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Upcoming Events</h2>
          <Link to="/team-schedule" className="text-xs text-green-400 hover:text-green-300">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-5 text-center">
            <p className="text-slate-400 text-sm">No upcoming events this week</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                className="flex items-center gap-4 p-3 rounded-xl border border-slate-700/50 bg-[#1e2d4a] hover:bg-[#2d3d5c] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{e.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <TimeLabel iso={e.start} />
                    {e.venue?.name ? ` · ${e.venue.name}` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${EVENT_TYPE_BADGE[e.type] || 'bg-slate-500/20 text-slate-400'}`}>
                  {e.type}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ value, label, color, theme }) {
  return (
    <div
      className="rounded-xl border border-slate-700/50 p-4"
      style={{ backgroundColor: '#1e2d4a' }}
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
