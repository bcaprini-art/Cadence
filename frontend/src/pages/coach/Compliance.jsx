import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockRoster } from '../../lib/mock';
import api, { eventsAPI } from '../../lib/api';

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

// ─── Download helper ──────────────────────────────────────────────────────────

async function downloadFile(url, params, defaultFilename) {
  try {
    const response = await api.get(url, { params, responseType: 'blob' });
    const blob = response.data;
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    // Try to get filename from Content-Disposition header
    const cd = response.headers['content-disposition'];
    const match = cd && cd.match(/filename="([^"]+)"/);
    a.download = match ? match[1] : defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
    return null;
  } catch (err) {
    return err.response?.data?.error || err.message || 'Download failed';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Compliance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get('teamId');

  const [weekStart, setWeekStart] = useState(getMondayOfWeek());
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [certified, setCertified] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [weekEvents, setWeekEvents] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  // Determine team ID: from URL param, or user's own team
  const teamId = teamIdParam || user?.teamId;

  // ─── Load compliance data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!teamId) {
      setUseMock(true);
      return;
    }
    async function load() {
      setLoading(true);
      setComplianceData(null);
      try {
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndDate = new Date(weekStart);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        const [complianceRes, eventsRes] = await Promise.all([
          api.get('/compliance/summary', { params: { teamId, weekStart: weekStartStr } }),
          eventsAPI.getEvents({
            teamId,
            start: weekStart.toISOString(),
            end: weekEndDate.toISOString(),
          }),
        ]);
        setComplianceData(complianceRes.data);
        // Filter to FILM and MEETING events only (those can be made voluntary)
        setWeekEvents((eventsRes.data || []).filter(e => ['FILM', 'MEETING'].includes(e.type)));
        setUseMock(false);
      } catch (err) {
        // Fall back to mock if no team assigned or API not available
        console.warn('[Compliance] API failed, using mock data:', err.message);
        setUseMock(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId, weekStart]);

  // ─── Week navigation ───────────────────────────────────────────────────────
  function shiftWeek(delta) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
    setCertified(false); // reset cert on week change
  }

  // ─── Export handlers ───────────────────────────────────────────────────────
  async function handleExport(format) {
    if (!teamId) {
      setExportError('No team assigned — cannot export. Connect to a live team first.');
      return;
    }
    setExportError(null);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const sport = complianceData?.team?.sport || 'team';
    const err = await downloadFile(
      `/compliance/export/${format}`,
      { teamId, weekStart: weekStartStr },
      `compliance-${sport.replace(/\s+/g, '-').toLowerCase()}-${weekStartStr}.${format}`
    );
    if (err) setExportError(`Export failed: ${err}`);
  }

  // ─── Derived data ──────────────────────────────────────────────────────────
  let athletes = [];
  let avgHours = '0.0';
  let violations = [];
  let warnings = [];
  let maxHoursWeek = 20;
  let teamInfo = null;

  if (!useMock && complianceData) {
    athletes = complianceData.athletes || [];
    maxHoursWeek = complianceData.maxHoursWeek || 20;
    violations = athletes.filter((a) => a.status === 'violation');
    warnings = athletes.filter((a) => a.status === 'warning');
    avgHours = complianceData.totals?.avgHours?.toString() || '0.0';
    teamInfo = complianceData.team;
  } else {
    // Mock fallback
    violations = mockRoster.filter((a) => a.cara_hours >= a.cara_limit);
    warnings = mockRoster.filter(
      (a) => a.cara_hours / a.cara_limit >= 0.85 && a.cara_hours < a.cara_limit
    );
    avgHours = (mockRoster.reduce((s, a) => s + a.cara_hours, 0) / mockRoster.length).toFixed(1);
    maxHoursWeek = 20;
  }

  const weekLabel = formatWeekLabel(weekStart);
  const isCurrentWeek = weekStart.toDateString() === getMondayOfWeek().toDateString();

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">NCAA Compliance — CARA Hours</h1>
          <p className="text-sm text-gray-400 mt-1">
            {teamInfo
              ? `${teamInfo.school?.name} · ${teamInfo.sport} · ${teamInfo.division}`
              : `Division I`}
            {useMock && <span className="text-yellow-500/70 ml-2">(demo data)</span>}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 border border-white/10 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            📄 Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 border border-white/10 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Export error */}
      {exportError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">
          {exportError}
        </div>
      )}

      {/* Week Selector */}
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
          disabled={isCurrentWeek}
          className="text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Athletes',
            value: useMock ? mockRoster.length : (complianceData?.totals?.total ?? 0),
            color: 'text-white',
          },
          { label: 'Avg CARA Hours', value: `${avgHours}h`, color: 'text-blue-400' },
          {
            label: 'Warnings',
            value: warnings.length,
            color: warnings.length > 0 ? 'text-yellow-400' : 'text-green-400',
          },
          {
            label: 'Violations',
            value: violations.length,
            color: violations.length > 0 ? 'text-red-400' : 'text-green-400',
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0d1526] rounded-xl border border-white/10 p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-8 text-center text-gray-400 text-sm">
          Loading compliance data...
        </div>
      )}

      {/* CARA Meters — Live Data */}
      {!loading && !useMock && complianceData && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-6 mb-6">
          <h2 className="font-semibold mb-4">Athlete CARA Hours (Weekly)</h2>
          {athletes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No CARA data for this week</p>
          ) : (
            <div className="space-y-4">
              {[...athletes]
                .sort((a, b) => b.weeklyTotal - a.weeklyTotal)
                .map((a) => {
                  const pct = Math.round((a.weeklyTotal / maxHoursWeek) * 100);
                  const color =
                    pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-yellow-400' : 'bg-green-500';
                  const label =
                    pct >= 100 ? '🔴 VIOLATION' : pct >= 85 ? '🟡 Warning' : '🟢 OK';
                  const textColor =
                    pct >= 100 ? 'text-red-400' : pct >= 85 ? 'text-yellow-400' : 'text-green-400';

                  return (
                    <div key={a.athlete.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                            {a.athlete.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <span className="text-sm font-medium">{a.athlete.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{label}</span>
                          <span className="text-sm font-medium">
                            <span className={textColor}>{a.weeklyTotal.toFixed(1)}h</span>
                            <span className="text-gray-500"> / {maxHoursWeek}h</span>
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${color}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      {/* Daily breakdown */}
                      {a.dailyHours && (
                        <div className="flex gap-1 mt-1.5">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <div key={day} className="flex-1 text-center">
                              <div
                                className={`text-xs ${a.dailyHours[day] > 0 ? textColor : 'text-gray-600'}`}
                              >
                                {a.dailyHours[day] > 0 ? `${a.dailyHours[day]}h` : '–'}
                              </div>
                              <div className="text-xs text-gray-600">{day}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* CARA Meters — Mock Data Fallback */}
      {!loading && useMock && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Athlete CARA Hours (Weekly)</h2>
            <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              Demo Data
            </span>
          </div>
          <div className="space-y-4">
            {[...mockRoster]
              .sort((a, b) => b.cara_hours - a.cara_hours)
              .map((a) => {
                const pct = Math.round((a.cara_hours / a.cara_limit) * 100);
                const color =
                  pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-yellow-400' : 'bg-green-500';
                const label =
                  pct >= 100 ? '🔴 VIOLATION' : pct >= 85 ? '🟡 Warning' : '🟢 OK';
                return (
                  <div key={a.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                          {a.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <span className="text-sm font-medium">{a.name}</span>
                        <span className="text-xs text-gray-500">#{a.number}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{label}</span>
                        <span className="text-sm font-medium">
                          <span
                            className={
                              pct >= 85
                                ? pct >= 100
                                  ? 'text-red-400'
                                  : 'text-yellow-400'
                                : 'text-green-400'
                            }
                          >
                            {a.cara_hours}h
                          </span>
                          <span className="text-gray-500"> / {a.cara_limit}h</span>
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${color}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    {pct >= 100 && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Exceeds D1 weekly limit — cannot schedule additional countable activities
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── Optional Activities Section ─────────────────────────────────── */}
      {!loading && !useMock && weekEvents.length > 0 && (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Optional Activity Toggle</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Mark FILM or MEETING events as voluntary — they won't count toward CARA limits
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {weekEvents.map((event) => {
              const startDate = new Date(event.start);
              const hours = ((new Date(event.end) - startDate) / (1000 * 60 * 60)).toFixed(1);
              const dayLabel = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    event.isVoluntary
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{event.title}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400">{event.type}</span>
                        {event.isVoluntary && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            📌 Voluntary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{dayLabel} · {hours}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="relative group">
                      <span className="text-xs text-gray-500 cursor-help">
                        Voluntary?
                        <span className="hidden group-hover:block absolute right-0 top-full mt-1 w-52 bg-gray-800 border border-white/10 rounded-lg p-2 text-gray-300 text-xs z-10 shadow-xl">
                          Voluntary activities don't count toward CARA limits
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={togglingId === event.id}
                      onClick={async () => {
                        setTogglingId(event.id);
                        try {
                          const { data } = await eventsAPI.setVoluntary(event.id, !event.isVoluntary);
                          setWeekEvents((prev) =>
                            prev.map((e) => (e.id === event.id ? { ...e, isVoluntary: data.isVoluntary } : e))
                          );
                          // Reload compliance data since CARA hours changed
                          const weekStartStr = weekStart.toISOString().split('T')[0];
                          const res = await api.get('/compliance/summary', { params: { teamId, weekStart: weekStartStr } });
                          setComplianceData(res.data);
                        } catch (err) {
                          console.error('Toggle failed:', err);
                        } finally {
                          setTogglingId(null);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        event.isVoluntary ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          event.isVoluntary ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certification Checkbox */}
      <div
        className={`rounded-xl border p-5 transition-colors ${
          certified
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-[#0d1526] border-white/10'
        }`}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={certified}
            onChange={(e) => setCertified(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-green-500 cursor-pointer flex-shrink-0"
          />
          <div>
            <p className={`text-sm font-medium ${certified ? 'text-green-300' : 'text-white'}`}>
              {certified ? '✅ Certified' : 'Compliance Certification'}
            </p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              I certify these hours are accurate per NCAA regulations. By checking this box, I confirm
              that all CARA hours reported for <strong>{weekLabel}</strong> are complete and comply
              with applicable NCAA bylaws regarding countable athletically related activities.
            </p>
          </div>
        </label>
        {certified && (
          <p className="mt-3 text-xs text-green-400 flex items-center gap-1.5">
            <span>🔒</span>
            <span>
              Certified by {user?.name} on{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
