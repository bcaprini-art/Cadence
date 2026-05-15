import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function PlayerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    hometown: '',
    likes: '',
    dislikes: '',
    foodAllergies: '',
    bio: '',
    photoUrl: '',
    jerseyNumber: '',
    position: '',
    height: '',
    weight: '',
    year: '',
    major: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/profile/me');
        const p = data.profile || data;
        setProfile(p);
        setForm({
          hometown: p.hometown || '',
          likes: p.likes || '',
          dislikes: p.dislikes || '',
          foodAllergies: p.foodAllergies || '',
          bio: p.bio || '',
          photoUrl: p.photoUrl || '',
          jerseyNumber: p.jerseyNumber || '',
          position: p.position || '',
          height: p.height || '',
          weight: p.weight || '',
          year: p.year || '',
          major: p.major || '',
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.patch('/profile/me', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm animate-pulse">Loading profile…</div>
      </div>
    );
  }

  const fields = [
    { key: 'hometown', label: 'Hometown', placeholder: 'e.g. Springfield, IL', type: 'text' },
    { key: 'likes', label: 'Likes', placeholder: 'Things you enjoy', type: 'text' },
    { key: 'dislikes', label: 'Dislikes', placeholder: "Things you don't enjoy", type: 'text' },
    { key: 'foodAllergies', label: 'Food Allergies', placeholder: 'e.g. Peanuts, dairy', type: 'text' },
    { key: 'bio', label: 'Bio', placeholder: 'Tell us about yourself', type: 'textarea' },
    { key: 'photoUrl', label: 'Photo URL', placeholder: 'https://example.com/photo.jpg', type: 'text' },
    { key: 'jerseyNumber', label: 'Jersey Number', placeholder: 'e.g. 7', type: 'text' },
    { key: 'position', label: 'Position', placeholder: 'e.g. Forward, Guard', type: 'text' },
    { key: 'height', label: 'Height', placeholder: "e.g. 6'2\"", type: 'text' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g. 185 lbs', type: 'text' },
    { key: 'year', label: 'Year', placeholder: 'e.g. Freshman, Sophomore', type: 'text' },
    { key: 'major', label: 'Major', placeholder: 'e.g. Computer Science', type: 'text' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Player Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Edit your personal information
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
          Profile saved successfully!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#0d1526] rounded-xl border border-white/10 p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label, placeholder, type }) => (
            <div key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={form[key]}
                  onChange={handleChange(key)}
                  placeholder={placeholder}
                  className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                />
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={handleChange(key)}
                  placeholder={placeholder}
                  className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
