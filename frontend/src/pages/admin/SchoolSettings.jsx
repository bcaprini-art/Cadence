import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const SEASON_COLORS = {
  fall:   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  winter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  spring: 'bg-green-500/20 text-green-300 border-green-500/30',
};

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
];

const DIVISIONS = ['D1', 'D2', 'D3', 'NAIA', 'NJCAA'];

function LogoSection({ school, onLogoChange }) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setImgError(false);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post(`/schools/${school.id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onLogoChange(data.logoUrl);
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the school logo?')) return;
    setRemoving(true);
    try {
      await api.delete(`/schools/${school.id}/logo`);
      onLogoChange(null);
      setImgError(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Remove failed');
    } finally {
      setRemoving(false);
    }
  };

  const logoUrl = school?.logoUrl;

  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4">School Logo</h2>
      <div className="flex items-center gap-6">
        {/* Logo preview */}
        <div className="relative">
          {logoUrl && !imgError ? (
            <img
              src={`${API_BASE}${logoUrl}`}
              alt="School logo"
              className="w-24 h-24 rounded-full object-contain bg-white/5 border border-white/10"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-4xl font-bold text-black">
              C
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.svg,.webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {uploading ? 'Uploading...' : '📤 Upload Logo'}
          </button>
          {logoUrl && !imgError && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {removing ? 'Removing...' : '🗑️ Remove Logo'}
            </button>
          )}
          <p className="text-xs text-gray-500">JPG, PNG, SVG, WebP · Max 5MB</p>
        </div>
      </div>
    </div>
  );
}

function SchoolInfoSection({ school, onSave }) {
  const [form, setForm] = useState({
    name: school?.name || '',
    conference: school?.conference || '',
    timezone: school?.timezone || 'America/Chicago',
    division: school?.division || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      name: school?.name || '',
      conference: school?.conference || '',
      timezone: school?.timezone || 'America/Chicago',
      division: school?.division || '',
    });
  }, [school]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put(`/schools/${school.id}`, form);
      onSave(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4">School Information</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">School Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/60 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Conference</label>
            <input
              type="text"
              value={form.conference}
              onChange={e => setForm({ ...form, conference: e.target.value })}
              placeholder="e.g. Big Ten, MAC, SWAC"
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/60 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm({ ...form, timezone: e.target.value })}
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/60 text-sm"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Division</label>
            <select
              value={form.division}
              onChange={e => setForm({ ...form, division: e.target.value })}
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/60 text-sm"
            >
              <option value="">— Select Division —</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-400 text-sm">✓ Saved!</span>}
        </div>
      </form>
    </div>
  );
}

function SportCard({ sport, active, onClick }) {
  return (
    <button
      onClick={() => onClick(sport)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
        active
          ? 'border-green-500/60 bg-green-500/10 text-white'
          : 'border-white/10 bg-[#0d1526] text-gray-400 hover:border-white/20 hover:text-white'
      }`}
    >
      {active && (
        <span className="absolute top-1.5 right-1.5 text-green-400 text-xs">✓</span>
      )}
      <span className="text-2xl">{sport.icon}</span>
      <span className="text-xs font-medium leading-tight">{sport.name}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${SEASON_COLORS[sport.season]}`}>
        {sport.season}
      </span>
    </button>
  );
}

function SportSelectionSection({ schoolId, existingTeams }) {
  const [sports, setSports] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [activeIds, setActiveIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    api.get('/sports').then(({ data }) => setSports(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Map existing teams' sport field to sport IDs
    const ids = new Set(
      existingTeams
        .map(t => {
          // Try to match by sport name
          return t.sportId || t.sport?.toLowerCase().replace(/[^a-z0-9]/g, '-') || '';
        })
        .filter(Boolean)
    );
    setActiveIds(ids);
  }, [existingTeams]);

  const filterTabs = ['All', "Men's", "Women's", 'Mixed'];

  const filtered = sports.filter(s => {
    const genderMatch =
      filter === 'All' ||
      (filter === "Men's" && s.gender === 'M') ||
      (filter === "Women's" && s.gender === 'W') ||
      (filter === 'Mixed' && s.gender === 'mixed');
    const searchMatch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return genderMatch && searchMatch;
  });

  const handleToggle = async (sport) => {
    if (toggling) return;
    setToggling(sport.id);
    try {
      if (activeIds.has(sport.id)) {
        // For now just visually deactivate — full remove would need team ID
        setActiveIds(prev => { const n = new Set(prev); n.delete(sport.id); return n; });
      } else {
        await api.post('/teams', {
          sport: sport.name,
          division: 'D1', // default; can be updated in team settings
          schoolId,
          sportId: sport.id,
        });
        setActiveIds(prev => new Set([...prev, sport.id]));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update sport');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-1">Sports Programs</h2>
      <p className="text-sm text-gray-400 mb-4">Click a sport to add or remove it from your school's programs.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-[#0a0f1e] rounded-lg p-1">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === tab ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sports..."
          className="flex-1 min-w-[180px] bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/60"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading sports...</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map(sport => (
            <SportCard
              key={sport.id}
              sport={sport}
              active={activeIds.has(sport.id)}
              onClick={handleToggle}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-gray-500 text-sm py-4 text-center">No sports match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SchoolSettings() {
  const { user, school: ctxSchool, refreshSchool } = useAuth();
  const [school, setSchool] = useState(ctxSchool);
  const [loading, setLoading] = useState(!ctxSchool);

  useEffect(() => {
    if (ctxSchool) {
      setSchool(ctxSchool);
      setLoading(false);
    } else if (user?.schoolId) {
      api.get(`/schools/${user.schoolId}`)
        .then(({ data }) => setSchool(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [ctxSchool, user]);

  const handleLogoChange = (logoUrl) => {
    setSchool(s => ({ ...s, logoUrl }));
    refreshSchool();
  };

  const handleInfoSave = (updated) => {
    setSchool(s => ({ ...s, ...updated }));
    refreshSchool();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-green-400 text-lg">Loading school settings...</div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No school found for your account.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚙️ School Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage logo, sports programs, and school details for {school.name}</p>
      </div>

      <LogoSection school={school} onLogoChange={handleLogoChange} />
      <SchoolInfoSection school={school} onSave={handleInfoSave} />
      <SportSelectionSection schoolId={school.id} existingTeams={school.teams || []} />
    </div>
  );
}
