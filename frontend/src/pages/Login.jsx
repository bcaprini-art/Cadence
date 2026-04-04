import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    setLoading(true);
    try {
      const email = role === 'coach' ? 'coach.harris@lakewood.edu' : 'jordan.lee@lakewood.edu';
      const password = role === 'coach' ? 'coach123' : 'athlete123';
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">Cadence</h1>
          <p className="text-xs text-slate-400">College Athletics Scheduling</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Sign in</h2>
        <p className="text-sm text-slate-400 mb-6">Welcome back to your team</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@state.edu"
              required
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/30 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/30 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Demo quick-login */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center mb-3">Demo — jump right in</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickLogin('athlete')}
              disabled={loading}
              className="flex flex-col items-center gap-1 bg-[#1e2d4a] hover:bg-[#2d3d5c] border border-slate-600/50 rounded-lg p-3 transition-colors text-center"
            >
              <span className="text-xl">🏃</span>
              <span className="text-sm font-medium text-white">Athlete View</span>
              <span className="text-xs text-slate-400">Jordan Mitchell</span>
            </button>
            <button
              onClick={() => quickLogin('coach')}
              disabled={loading}
              className="flex flex-col items-center gap-1 bg-[#1e2d4a] hover:bg-[#2d3d5c] border border-slate-600/50 rounded-lg p-3 transition-colors text-center"
            >
              <span className="text-xl">📋</span>
              <span className="text-sm font-medium text-white">Coach View</span>
              <span className="text-xs text-slate-400">Coach Rivera</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          No account?{' '}
          <Link to="/register" className="text-green-400 hover:text-green-300 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
