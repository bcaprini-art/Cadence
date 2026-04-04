import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const EVENT_TYPE_COLORS = {
  PRACTICE: 'bg-blue-500/20 text-blue-400',
  GAME: 'bg-green-500/20 text-green-400',
  TRAVEL: 'bg-purple-500/20 text-purple-400',
  FILM: 'bg-yellow-500/20 text-yellow-400',
  MEETING: 'bg-gray-500/20 text-gray-400',
};

function CompliancePill({ status }) {
  const map = {
    violation: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ok: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  const labels = { violation: '🔴 Violation', warning: '🟡 Warning', ok: '🟢 Compliant' };
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${map[status] || map.ok}`}>
      {labels[status] || 'Unknown'}
    </span>
  );
}

export default function SchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [teamsRes, statsRes] = await Promise.all([
          api.get(`/admin/schools/${id}/teams`),
          api.get(`/admin/schools/${id}/stats`),
        ]);
        setData(teamsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load school data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-green-400 text-sm">Loading school details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  const { school, teams } = data;

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white">{school.name}</h1>
        <p className="text-gray-400 mt-1">
          {school.conference ? `${school.conference} · ` : ''}
          {school.timezone}
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { value: stats.totalAthletes, label: 'Athletes', color: 'text-white' },
            { value: stats.totalCoaches, label: 'Coaches', color: 'text-blue-400' },
            { value: stats.totalTeams, label: 'Teams', color: 'text-purple-400' },
            {
              value: `${stats.avgCARAHours}h`,
              label: 'Avg CARA',
              color:
                stats.avgCARAHours >= 17
                  ? 'text-yellow-400'
                  : stats.avgCARAHours >= 20
                  ? 'text-red-400'
                  : 'text-green-400',
            },
            {
              value: stats.athletesAtRisk,
              label: 'At Risk',
              color: stats.athletesAtRisk > 0 ? 'text-yellow-400' : 'text-green-400',
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1526] border border-white/10 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Teams Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Teams & Compliance</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {teams.length === 0 ? (
            <div className="col-span-2 bg-[#0d1526] border border-white/10 rounded-xl p-8 text-center text-gray-500 text-sm">
              No teams found for this school
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="bg-[#0d1526] border border-white/10 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{team.sport}</h3>
                    <p className="text-xs text-gray-500">{team.division}</p>
                  </div>
                  <CompliancePill status={team.complianceStatus} />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-white/5 rounded-lg p-2">
                    <div className="text-sm font-bold text-white">{team.athleteCount}</div>
                    <div className="text-xs text-gray-500">Athletes</div>
                  </div>
                  <div className="text-center bg-white/5 rounded-lg p-2">
                    <div
                      className={`text-sm font-bold ${
                        team.avgCARAHours >= 17
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {team.avgCARAHours}h
                    </div>
                    <div className="text-xs text-gray-500">Avg CARA</div>
                  </div>
                  <div className="text-center bg-white/5 rounded-lg p-2">
                    <div
                      className={`text-sm font-bold ${
                        team.violations > 0
                          ? 'text-red-400'
                          : team.warnings > 0
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {team.violations > 0
                        ? `${team.violations}V`
                        : team.warnings > 0
                        ? `${team.warnings}W`
                        : '✓'}
                    </div>
                    <div className="text-xs text-gray-500">Alerts</div>
                  </div>
                </div>

                {/* Upcoming Events */}
                {team.upcomingEvents?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Upcoming</p>
                    <div className="space-y-1">
                      {team.upcomingEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                EVENT_TYPE_COLORS[ev.type] || 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {ev.type}
                            </span>
                            <span className="text-gray-300">{ev.title}</span>
                          </div>
                          <span className="text-gray-500">
                            {new Date(ev.start).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/compliance?teamId=${team.id}`)}
                  className="mt-4 w-full text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg py-2 hover:bg-white/5 transition-colors"
                >
                  View Compliance Report →
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events Calendar */}
      {stats?.upcomingEvents?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Upcoming Events — All Sports</h2>
          <div className="bg-[#0d1526] border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
              <div>Event</div>
              <div>Sport</div>
              <div>Type</div>
              <div>Date</div>
            </div>
            {stats.upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="grid grid-cols-4 px-4 py-3 border-b border-white/5 last:border-0 items-center"
              >
                <div className="text-sm text-white">{ev.title}</div>
                <div className="text-xs text-gray-400">{ev.team?.sport}</div>
                <div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      EVENT_TYPE_COLORS[ev.type] || 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {ev.type}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(ev.start).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
