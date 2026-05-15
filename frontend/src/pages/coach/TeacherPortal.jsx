import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function TeacherPortal() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.teamId) return;
    const fetchGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/grades/team/${user.teamId}`);
        setGrades(Array.isArray(data) ? data : data.grades || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user?.teamId]);

  const filtered = grades.filter((g) =>
    g.athleteName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm animate-pulse">Loading grades…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Teacher Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Grade information shared by teachers for your team
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by athlete name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
          />
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-400 text-sm">No grades have been shared yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Teachers will appear here once they enter grades for your athletes.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-8 text-center">
          <p className="text-slate-400 text-sm">No athletes match "{search}"</p>
        </div>
      ) : (
        <div className="bg-[#0d1526] rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-6 px-5 py-3 text-xs text-slate-500 border-b border-white/5 font-medium uppercase tracking-wider">
            <span className="col-span-2">Athlete</span>
            <span>Course</span>
            <span>Grade</span>
            <span>Term</span>
            <span>Teacher</span>
          </div>
          {filtered.map((g, i) => (
            <div
              key={g.id || i}
              className="grid grid-cols-6 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors items-center"
            >
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                  {g.athleteName?.split(' ').map((n) => n[0]).join('') || '?'}
                </div>
                <span className="text-sm font-medium text-white">
                  {g.athleteName}
                </span>
              </div>
              <span className="text-sm text-slate-300">{g.courseName || g.course}</span>
              <span
                className={`text-sm font-semibold ${
                  !g.grade || g.grade === 'F'
                    ? 'text-red-400'
                    : g.grade?.startsWith('A')
                    ? 'text-green-400'
                    : g.grade?.startsWith('B')
                    ? 'text-blue-400'
                    : 'text-yellow-400'
                }`}
              >
                {g.grade || '—'}
              </span>
              <span className="text-sm text-slate-400">
                {g.term ? `${g.term} ${g.year || ''}` : '—'}
              </span>
              <span className="text-sm text-slate-400 truncate">{g.teacherName || g.teacher || '—'}</span>
            </div>
          ))}
          <div className="px-5 py-3 text-xs text-slate-500 border-t border-white/5">
            Showing {filtered.length} of {grades.length} grade entries
          </div>
        </div>
      )}
    </div>
  );
}
