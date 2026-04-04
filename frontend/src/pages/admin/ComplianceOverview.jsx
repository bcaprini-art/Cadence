import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

function StatusBadge({ status }) {
  const map = {
    violation: { cls: 'bg-red-500/20 text-red-400 border-red-500/30', label: '🔴 Violation' },
    warning: { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '🟡 Warning' },
    ok: { cls: 'bg-green-500/20 text-green-400 border-green-500/30', label: '🟢 Compliant' },
  };
  const s = map[status] || map.ok;
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  );
}

const RISK_ORDER = { violation: 0, warning: 1, ok: 2 };

export default function ComplianceOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolIdFilter = searchParams.get('schoolId');

  const [schools, setSchools] = useState([]);
  const [teamSummaries, setTeamSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [error, setError] = useState(null);

  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load all schools to get team IDs
        const schoolsRes = await api.get('/admin/schools');
        setSchools(schoolsRes.data);

        // Load teams for relevant schools
        const targetSchools = schoolIdFilter
          ? schoolsRes.data.filter((s) => s.id === schoolIdFilter)
          : schoolsRes.data;

        const teamResults = await Promise.all(
          targetSchools.map((sc) => api.get(`/admin/schools/${sc.id}/teams`))
        );

        const allTeams = teamResults.flatMap((res) =>
          res.data.teams.map((t) => ({
            ...t,
            schoolName: res.data.school.name,
            schoolId: res.data.school.id,
          }))
        );

        // Load compliance summaries for each team
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const summaryResults = await Promise.allSettled(
          allTeams.map((team) =>
            api.get('/compliance/summary', { params: { teamId: team.id, weekStart: weekStartStr } })
          )
        );

        const summaries = summaryResults.map((result, i) => {
          if (result.status === 'fulfilled') {
            return { ...allTeams[i], summary: result.value.data };
          }
          return { ...allTeams[i], summary: null };
        });

        // Sort by risk: violations first, then warnings, then ok
        summaries.sort((a, b) => {
          const aStatus = a.summary?.totals?.violations > 0
            ? 'violation'
            : a.summary?.totals?.warnings > 0
            ? 'warning'
            : 'ok';
          const bStatus = b.summary?.totals?.violations > 0
            ? 'violation'
            : b.summary?.totals?.warnings > 0
            ? 'warning'
            : 'ok';
          return (RISK_ORDER[aStatus] ?? 2) - (RISK_ORDER[bStatus] ?? 2);
        });

        setTeamSummaries(summaries);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [schoolIdFilter, weekStart]);

  function shiftWeek(delta) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  }

  async function exportTeam(teamId, sport, format) {
    try {
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const response = await api.get(`/compliance/export/${format}`, {
        params: { teamId, weekStart: weekStartStr },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-${sport.replace(/\s+/g, '-').toLowerCase()}-${weekStartStr}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.response?.data?.error || err.message}`);
    }
  }

  async function bulkExportAll() {
    setBulkExporting(true);
    for (const team of teamSummaries) {
      await exportTeam(team.id, team.sport, 'csv');
      await new Promise((r) => setTimeout(r, 300)); // small delay between downloads
    }
    setBulkExporting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-green-400 text-sm">Loading compliance overview...</div>
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

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const totalViolations = teamSummaries.reduce((s, t) => s + (t.summary?.totals?.violations || 0), 0);
  const totalWarnings = teamSummaries.reduce((s, t) => s + (t.summary?.totals?.warnings || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-sm text-gray-400 hover:text-white mb-3 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Compliance Overview</h1>
          <p className="text-gray-400 mt-1">All sports · Cross-team CARA compliance</p>
        </div>
        <button
          onClick={bulkExportAll}
          disabled={bulkExporting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {bulkExporting ? '⏳ Exporting...' : '📥 Bulk Export All Teams (CSV)'}
        </button>
      </div>

      {/* Week Selector */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => shiftWeek(-1)}
          className="text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
        >
          ← Prev Week
        </button>
        <span className="text-sm text-white font-medium bg-[#0d1526] border border-white/10 px-4 py-1.5 rounded-lg">
          {weekLabel}
        </span>
        <button
          onClick={() => shiftWeek(1)}
          className="text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
        >
          Next Week →
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0d1526] border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{teamSummaries.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Teams</div>
        </div>
        <div className="bg-[#0d1526] border border-white/10 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalViolations}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Violations</div>
        </div>
        <div className="bg-[#0d1526] border border-white/10 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${totalWarnings > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {totalWarnings}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Warnings</div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-[#0d1526] border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
          <div className="col-span-2">Team / School</div>
          <div className="text-center">Athletes</div>
          <div className="text-center">Avg CARA</div>
          <div className="text-center">Violations</div>
          <div className="text-center">Status</div>
          <div className="text-right">Export</div>
        </div>

        {teamSummaries.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No teams found</div>
        ) : (
          teamSummaries.map((team) => {
            const totals = team.summary?.totals;
            const status = totals?.violations > 0
              ? 'violation'
              : totals?.warnings > 0
              ? 'warning'
              : 'ok';

            return (
              <div
                key={team.id}
                className="grid grid-cols-7 px-4 py-3 border-b border-white/5 last:border-0 items-center"
              >
                <div className="col-span-2">
                  <p className="text-sm font-medium text-white">{team.sport}</p>
                  <p className="text-xs text-gray-500">{team.schoolName} · {team.division}</p>
                </div>
                <div className="text-center text-sm text-gray-300">
                  {totals?.total ?? team.athleteCount}
                </div>
                <div className="text-center">
                  <span
                    className={`text-sm font-medium ${
                      (totals?.avgHours || 0) >= 17
                        ? 'text-yellow-400'
                        : (totals?.avgHours || 0) >= 20
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {totals?.avgHours ?? '—'}h
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-medium ${totals?.violations > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {totals?.violations ?? 0}
                  </span>
                </div>
                <div className="flex justify-center">
                  <StatusBadge status={status} />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => exportTeam(team.id, team.sport, 'pdf')}
                    className="text-xs border border-white/10 px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => exportTeam(team.id, team.sport, 'csv')}
                    className="text-xs border border-white/10 px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    CSV
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
