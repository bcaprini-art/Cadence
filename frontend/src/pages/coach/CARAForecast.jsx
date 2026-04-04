import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complianceAPI } from '../../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function statusColor(status) {
  switch (status) {
    case 'violation': return { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-500/20 text-red-300' };
    case 'risk': return { bar: 'bg-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' };
    case 'warning': return { bar: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-300' };
    default: return { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', badge: 'bg-green-500/20 text-green-300' };
  }
}

function statusLabel(status) {
  switch (status) {
    case 'violation': return '🔴 Violation';
    case 'risk': return '🟠 At Risk';
    case 'warning': return '🟡 Warning';
    default: return '🟢 On Track';
  }
}

// ─── Day Bar ──────────────────────────────────────────────────────────────────

function DayGrid({ daily, limit }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDay = limit / 5; // approximate daily max for bar scaling

  return (
    <div className="flex gap-1">
      {days.map((d) => {
        const h = daily[d] || 0;
        const pct = Math.min((h / maxDay) * 100, 100);
        const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-green-500';
        return (
          <div key={d} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className="w-full bg-white/10 rounded-sm h-8 flex items-end overflow-hidden">
              {h > 0 && (
                <div
                  className={`w-full ${color} rounded-sm transition-all`}
                  style={{ height: `${pct}%` }}
                />
              )}
            </div>
            <span className="text-[9px] text-gray-500">{d.slice(0, 1)}</span>
            {h > 0 && <span className="text-[9px] text-gray-400">{h}h</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── CARA Split Bar ───────────────────────────────────────────────────────────

function CARAMeterSplit({ current, scheduled, limit }) {
  const currentPct = Math.min((current / limit) * 100, 100);
  const scheduledPct = Math.min((scheduled / limit) * 100, 100 - currentPct);
  const totalPct = currentPct + scheduledPct;
  const totalColor = totalPct >= 100 ? 'text-red-400' : totalPct >= 95 ? 'text-orange-400' : totalPct >= 85 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">CARA Hours</span>
        <span className={totalColor}>{(current + scheduled).toFixed(1)} / {limit}h</span>
      </div>
      <div className="bg-white/10 rounded-full h-3 overflow-hidden relative">
        {/* Current solid bar */}
        <div
          className={`absolute left-0 top-0 h-full rounded-l-full transition-all ${totalPct >= 100 ? 'bg-red-500' : totalPct >= 95 ? 'bg-orange-400' : totalPct >= 85 ? 'bg-yellow-400' : 'bg-green-500'}`}
          style={{ width: `${currentPct}%` }}
        />
        {/* Scheduled striped bar */}
        {scheduledPct > 0 && (
          <div
            className="absolute top-0 h-full opacity-60"
            style={{
              left: `${currentPct}%`,
              width: `${scheduledPct}%`,
              background: 'repeating-linear-gradient(45deg, #a3e635, #a3e635 3px, transparent 3px, transparent 6px)',
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] mt-1 text-gray-500">
        <span>Logged: {current.toFixed(1)}h</span>
        {scheduled > 0 && <span className="text-lime-500/70">+{scheduled.toFixed(1)}h upcoming</span>}
        <span>Remaining: {Math.max(0, limit - current - scheduled).toFixed(1)}h</span>
      </div>
    </div>
  );
}

// ─── Athlete Row ──────────────────────────────────────────────────────────────

function AthleteRow({ athlete }) {
  const [expanded, setExpanded] = useState(false);
  const colors = statusColor(athlete.status);
  const initials = athlete.name.split(' ').map((n) => n[0]).join('');

  return (
    <div className={`rounded-xl border ${colors.bg} p-4 transition-all`}>
      {/* Main row */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white">{athlete.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
              {statusLabel(athlete.status)}
            </span>
          </div>
          {/* Compact day grid */}
          <div className="mt-2">
            <DayGrid daily={athlete.dailyBreakdown} limit={athlete.limit} />
          </div>
        </div>

        {/* Right: hours badge + expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className={`text-lg font-bold ${colors.text}`}>
              {athlete.projectedHours.toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500">/ {athlete.limit}h</div>
          </div>
          <span className="text-gray-500 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          <CARAMeterSplit
            current={athlete.currentHours}
            scheduled={athlete.scheduledHours}
            limit={athlete.limit}
          />

          {athlete.upcomingEvents.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Upcoming Countable Events</p>
              <div className="space-y-1.5">
                {athlete.upcomingEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-gray-300">{evt.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{evt.date}</span>
                      <span className={`text-xs font-medium ${colors.text}`}>{evt.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {athlete.upcomingEvents.length === 0 && (
            <p className="text-xs text-gray-500">No additional countable events scheduled this week.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Smart Insights Panel ─────────────────────────────────────────────────────

function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Smart Insights</h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <p key={i} className="text-sm text-yellow-200/80 leading-relaxed">
            {insight.message}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CARAForecast() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(getMondayOfWeek());
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const teamId = user?.teamId;

  useEffect(() => {
    if (!teamId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const { data } = await complianceAPI.getForecast(teamId, weekStartStr);
        setForecast(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId, weekStart]);

  function shiftWeek(delta) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  }

  const isCurrentWeek = weekStart.toDateString() === getMondayOfWeek().toDateString();
  const weekLabel = formatWeekLabel(weekStart);

  const totals = forecast?.totals;
  const athletes = forecast?.athletes || [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 CARA Forecast</h1>
          <p className="text-sm text-gray-400 mt-1">
            Weekly CARA hour projections — current + scheduled events
          </p>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => shiftWeek(-1)}
          className="text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
        >
          ← Prev
        </button>
        <span className="text-sm text-white font-medium bg-[#0d1526] border border-white/10 px-4 py-1.5 rounded-lg">
          {weekLabel}
          {isCurrentWeek && (
            <span className="ml-2 text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
              Current
            </span>
          )}
        </span>
        <button
          onClick={() => shiftWeek(1)}
          className="text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
        >
          Next →
        </button>
      </div>

      {/* Summary cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Athletes', value: totals.total, color: 'text-white', icon: '👥' },
            { label: 'On Track', value: totals.onTrack, color: 'text-green-400', icon: '🟢' },
            { label: 'Warning >85%', value: totals.warning, color: totals.warning > 0 ? 'text-yellow-400' : 'text-gray-500', icon: '🟡' },
            { label: 'At Risk >95%', value: (totals.risk || 0) + (totals.violation || 0), color: ((totals.risk || 0) + (totals.violation || 0)) > 0 ? 'text-red-400' : 'text-gray-500', icon: '🔴' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1526] rounded-xl border border-white/10 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Smart insights */}
      {forecast?.insights && <InsightsPanel insights={forecast.insights} />}

      {/* No team */}
      {!teamId && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-8 text-center text-gray-400 text-sm">
          No team assigned. Ask your admin to assign you to a team.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-8 text-center text-gray-400 text-sm">
          Loading forecast…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Athlete rows */}
      {!loading && !error && athletes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Athlete Projections
          </h2>
          <div className="space-y-3">
            {[...athletes]
              .sort((a, b) => b.projectedHours - a.projectedHours)
              .map((athlete) => (
                <AthleteRow key={athlete.id} athlete={athlete} />
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && athletes.length === 0 && teamId && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-8 text-center text-gray-400 text-sm">
          No athletes found for this team.
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-white/10 pt-4">
        <span>📊 Striped bars = upcoming scheduled hours</span>
        <span>🟢 &lt;85% · 🟡 85–95% · 🟠 95–100% · 🔴 Over limit</span>
        <span>Click an athlete row to expand details</span>
      </div>
    </div>
  );
}
