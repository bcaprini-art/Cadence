import { useState, useEffect } from 'react';
import api from '../../lib/api';

const GRADE_OPTIONS = [
  'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F',
];

const TERM_OPTIONS = ['FALL', 'SPRING', 'SUMMER'];

export default function EnterGrades() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    athleteId: '',
    courseName: '',
    grade: '',
    term: 'FALL',
    year: new Date().getFullYear().toString(),
    notes: '',
  });

  useEffect(() => {
    const fetchAthletes = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/users', { params: { role: 'athlete' } });
        setAthletes(Array.isArray(data) ? data : data.users || data.athletes || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load athletes');
      } finally {
        setLoading(false);
      }
    };
    fetchAthletes();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.athleteId || !form.courseName || !form.grade) {
      setError('Athlete, course name, and grade are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/grades', form);
      setSuccess('Grade entered successfully!');
      setForm({
        athleteId: '',
        courseName: '',
        grade: '',
        term: 'FALL',
        year: new Date().getFullYear().toString(),
        notes: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm animate-pulse">Loading athletes…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Enter Grades</h1>
        <p className="text-sm text-slate-400 mt-1">
          Record academic grades for your athletes
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#0d1526] rounded-xl border border-white/10 p-6 space-y-4"
      >
        {/* Athlete Select */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Athlete *</label>
          <select
            value={form.athleteId}
            onChange={handleChange('athleteId')}
            required
            className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
          >
            <option value="">Select an athlete…</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Course Name *</label>
          <input
            type="text"
            value={form.courseName}
            onChange={handleChange('courseName')}
            placeholder="e.g. Algebra II, English Literature"
            required
            className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Grade Select */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Grade *</label>
          <select
            value={form.grade}
            onChange={handleChange('grade')}
            required
            className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
          >
            <option value="">Select a grade…</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Term and Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Term</label>
            <select
              value={form.term}
              onChange={handleChange('term')}
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              {TERM_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={handleChange('year')}
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={handleChange('notes')}
            placeholder="Optional notes about this grade entry"
            className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Submit Grade'}
          </button>
        </div>
      </form>
    </div>
  );
}
