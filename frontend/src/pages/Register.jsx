import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSportThemeByName } from '../lib/sportThemes';
import api from '../lib/api';

const SCHOOLS = [
  'State University', 'Riverside College', 'Lakewood University',
  'Metro Tech', 'Valley State', 'Eastside College', 'Other',
];

const SEASON_COLORS = {
  fall:   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  winter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  spring: 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = basic info, 2 = sport selection
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'athlete',
    sport: '',
    sportId: '',
    school: 'State University',
    team_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sport picker state
  const [sports, setSports] = useState([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [sportFilter, setSportFilter] = useState('All');
  const [sportSearch, setSportSearch] = useState('');
  const [hoveredSport, setHoveredSport] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  useEffect(() => {
    setSportsLoading(true);
    api.get('/sports')
      .then(({ data }) => setSports(data))
      .catch(() => {})
      .finally(() => setSportsLoading(false));
  }, []);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const filterTabs = ['All', "Men's", "Women's", 'Mixed'];

  const filteredSports = sports.filter(s => {
    const gMatch =
      sportFilter === 'All' ||
      (sportFilter === "Men's" && s.gender === 'M') ||
      (sportFilter === "Women's" && s.gender === 'W') ||
      (sportFilter === 'Mixed' && s.gender === 'mixed');
    const sMatch = !sportSearch || s.name.toLowerCase().includes(sportSearch.toLowerCase());
    return gMatch && sMatch;
  });

  // Get the theme for the currently selected or hovered sport
  const previewTheme = getSportThemeByName(hoveredSport || form.sport || '');

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: form.sport ? previewTheme.primary : '#22c55e' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">Cadence</h1>
          <p className="text-xs text-slate-400">College Athletics Scheduling</p>
        </div>
      </div>

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
          <p className="text-sm text-slate-400 mb-6">Join your athletics program</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleNextStep} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {['athlete', 'coach'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      form.role === r
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-slate-600/50 bg-[#1e2d4a] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xl">{r === 'athlete' ? '🏃' : '📋'}</span>
                    <span className="text-sm font-medium capitalize">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Full Name" type="text" value={form.name} onChange={set('name')} placeholder="Your name" required />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@state.edu" required />
            <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
            <Field label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required />

            {/* School */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">School</label>
              <select
                value={form.school}
                onChange={set('school')}
                className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/60 text-sm"
              >
                {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {form.role === 'coach' && (
              <Field label="Team Name (optional)" type="text" value={form.team_name} onChange={set('team_name')} placeholder="e.g. Varsity Basketball" />
            )}

            <button
              type="submit"
              className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
              style={{ backgroundColor: '#22c55e' }}
            >
              Next: Select Sport →
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">Sign in</Link>
          </p>
        </div>
      )}

      {/* Step 2 — Sport Selection */}
      {step === 2 && (
        <div className="w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
            ← Back
          </button>
          <h2 className="text-xl font-bold text-white mb-1">Select Your Sport</h2>
          <p className="text-sm text-slate-400 mb-6">
            {form.sport
              ? (
                <span className="flex items-center gap-2">
                  Selected:{' '}
                  <span className="font-medium" style={{ color: previewTheme.primary }}>
                    {previewTheme.icon} {form.sport}
                  </span>
                </span>
              )
              : 'Choose the sport you compete or coach in.'
            }
          </p>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex gap-1 bg-[#0a0f1e] rounded-lg p-1">
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setSportFilter(tab)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={sportFilter === tab ? { backgroundColor: previewTheme.primary, color: '#000' } : { color: '#9ca3af' }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={sportSearch}
              onChange={e => setSportSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 min-w-[140px] bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/60"
            />
          </div>

          {sportsLoading ? (
            <div className="text-gray-400 text-sm py-8 text-center">Loading sports...</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto mb-6 pr-1">
              {filteredSports.map(sport => {
                const sportTheme = getSportThemeByName(sport.name);
                const isSelected = form.sportId === sport.id;
                const isHovered = hoveredSport === sport.name;

                return (
                  <button
                    key={sport.id}
                    onClick={() => setForm({ ...form, sport: sport.name, sportId: sport.id })}
                    onMouseEnter={() => setHoveredSport(sport.name)}
                    onMouseLeave={() => setHoveredSport(null)}
                    className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center"
                    style={isSelected ? {
                      borderColor: `${sportTheme.primary}90`,
                      backgroundColor: `${sportTheme.primary}18`,
                      color: 'white',
                      boxShadow: `0 0 12px ${sportTheme.primary}40`,
                    } : isHovered ? {
                      borderColor: `${sportTheme.primary}60`,
                      backgroundColor: `${sportTheme.primary}10`,
                      color: 'white',
                    } : {
                      borderColor: 'rgba(255,255,255,0.1)',
                      backgroundColor: '#1e2d4a',
                      color: '#9ca3af',
                    }}
                  >
                    {isSelected && (
                      <span
                        className="absolute top-1.5 right-1.5 text-xs font-bold"
                        style={{ color: sportTheme.primary }}
                      >✓</span>
                    )}
                    <span className="text-2xl">{sport.icon}</span>
                    <span className="text-xs font-medium leading-tight">{sport.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${SEASON_COLORS[sport.season]}`}>
                      {sport.season}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !form.sport}
            className="w-full disabled:opacity-50 font-semibold py-2.5 rounded-lg transition-all text-black"
            style={{
              backgroundColor: form.sport ? previewTheme.primary : '#22c55e',
            }}
          >
            {loading ? 'Creating account...' : `Create Account ${form.sport ? previewTheme.icon : ''}`}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mt-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/30 transition-all text-sm"
      />
    </div>
  );
}
