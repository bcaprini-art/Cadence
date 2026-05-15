import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/grades/my');
        setGrades(Array.isArray(data) ? data : data.grades || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const totalGrades = grades.length;
  const thisTermGrades = grades.filter((g) => {
    const term = (g.term || '').toLowerCase();
    const now = new Date();
    const month = now.getMonth();
    // Approximate current term logic
    if (term === 'spring' && month >= 1 && month <= 4) return true;
    if (term === 'summer' && month >= 5 && month <= 7) return true;
    if (term === 'fall' && month >= 8 && month <= 11) return true;
    return false;
  }).length;

  // Unique athletes
  const athleteIds = new Set(grades.map((g) => g.athleteId).filter(Boolean));
  const athleteCount = athleteIds.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, {user?.name || 'Teacher'} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage grades for your athletes
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4">
          <div className="text-2xl font-bold text-green-400">{totalGrades}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Grades Entered</div>
        </div>
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4">
          <div className="text-2xl font-bold text-blue-400">{thisTermGrades}</div>
          <div className="text-xs text-slate-400 mt-0.5">This Term</div>
        </div>
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4">
          <div className="text-2xl font-bold text-yellow-400">{athleteCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Athletes</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/teacher/enter-grades"
          className="bg-[#0d1526] rounded-xl border border-white/10 p-5 hover:border-green-500/40 transition-all group"
        >
          <div className="text-3xl mb-2">📝</div>
          <h3 className="text-white font-semibold group-hover:text-green-400 transition-colors">
            Enter Grades
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Add new grade entries for your athletes
          </p>
        </Link>
        <Link
          to="/teacher/grades"
          className="bg-[#0d1526] rounded-xl border border-white/10 p-5 hover:border-blue-500/40 transition-all group"
        >
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
            View All Grades
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage all entered grades
          </p>
        </Link>
      </div>

      {/* Athlete List */}
      <div className="bg-[#0d1526] rounded-xl border border-white/10 p-5">
        <h2 className="font-semibold text-gray-200 mb-4">
          Athletes with Grades ({athleteCount})
        </h2>
        {grades.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm">No grades entered yet.</p>
            <Link
              to="/teacher/enter-grades"
              className="mt-2 inline-block text-sm text-green-400 hover:text-green-300"
            >
              Enter your first grade →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(
              grades
                .reduce((map, g) => {
                  const key = g.athleteId || g.athleteName || 'unknown';
                  if (!map.has(key)) {
                    map.set(key, {
                      id: g.athleteId,
                      name: g.athleteName || 'Unknown',
                      count: 0,
                      latestGrade: null,
                    });
                  }
                  const entry = map.get(key);
                  entry.count += 1;
                  entry.latestGrade = g.grade || entry.latestGrade;
                  return map;
                }, new Map())
                .values()
            ).map((athlete) => (
              <div
                key={athlete.id || athlete.name}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                    {athlete.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{athlete.name}</p>
                    <p className="text-xs text-slate-500">
                      {athlete.count} grade{athlete.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {athlete.latestGrade && (
                  <span
                    className={`text-sm font-semibold ${
                      athlete.latestGrade === 'F'
                        ? 'text-red-400'
                        : athlete.latestGrade?.startsWith('A')
                        ? 'text-green-400'
                        : athlete.latestGrade?.startsWith('B')
                        ? 'text-blue-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {athlete.latestGrade}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
