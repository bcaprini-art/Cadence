import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';

const EMPTY_TRIP = {
  destination: '',
  hotelName: '',
  hotelAddress: '',
  hotelPhone: '',
  checkIn: '',
  checkOut: '',
  departTime: '',
  returnTime: '',
  notes: '',
  foodOptions: '[]',
};

export default function TravelView() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/trips');
      setTrips(Array.isArray(data) ? data : data.trips || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const parseFoodOptions = (val) => {
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        foodOptions: parseFoodOptions(form.foodOptions),
      };
      if (editingTrip) {
        await api.patch(`/trips/${editingTrip.id}`, payload);
      } else {
        await api.post('/trips', payload);
      }
      setForm(EMPTY_TRIP);
      setEditingTrip(null);
      setShowForm(false);
      await fetchTrips();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setForm({
      destination: trip.destination || '',
      hotelName: trip.hotelName || '',
      hotelAddress: trip.hotelAddress || '',
      hotelPhone: trip.hotelPhone || '',
      checkIn: trip.checkIn ? trip.checkIn.slice(0, 10) : '',
      checkOut: trip.checkOut ? trip.checkOut.slice(0, 10) : '',
      departTime: trip.departTime || '',
      returnTime: trip.returnTime || '',
      notes: trip.notes || '',
      foodOptions: Array.isArray(trip.foodOptions)
        ? JSON.stringify(trip.foodOptions)
        : trip.foodOptions || '[]',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await api.delete(`/trips/${id}`);
      await fetchTrips();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete trip');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return format(parseISO(iso), 'MMM d, yyyy');
    } catch {
      return iso;
    }
  };

  const getStatus = (trip) => {
    const now = new Date();
    if (trip.checkIn && new Date(trip.checkIn) > now) return 'upcoming';
    if (trip.checkOut && new Date(trip.checkOut) < now) return 'past';
    return 'current';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm animate-pulse">Loading trips…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Travel View</h1>
          <p className="text-sm text-slate-400 mt-1">Upcoming and past team trips</p>
        </div>
        <button
          onClick={() => {
            setEditingTrip(null);
            setForm(EMPTY_TRIP);
            setShowForm(!showForm);
            setFormError(null);
          }}
          className="bg-green-500 hover:bg-green-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Trip'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Trip Form Modal/Inline */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#0d1526] rounded-xl border border-white/10 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">
            {editingTrip ? 'Edit Trip' : 'New Trip'}
          </h2>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Destination *</label>
              <input
                type="text"
                required
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hotel Name</label>
              <input
                type="text"
                value={form.hotelName}
                onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hotel Address</label>
              <input
                type="text"
                value={form.hotelAddress}
                onChange={(e) => setForm({ ...form, hotelAddress: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hotel Phone</label>
              <input
                type="text"
                value={form.hotelPhone}
                onChange={(e) => setForm({ ...form, hotelPhone: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Check-In Date</label>
              <input
                type="date"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Check-Out Date</label>
              <input
                type="date"
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Depart Time</label>
              <input
                type="text"
                placeholder="e.g. 2025-05-20T08:00:00Z"
                value={form.departTime}
                onChange={(e) => setForm({ ...form, departTime: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Return Time</label>
              <input
                type="text"
                placeholder="e.g. 2025-05-22T20:00:00Z"
                value={form.returnTime}
                onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
                className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Food Options (JSON array)</label>
            <textarea
              rows={3}
              value={form.foodOptions}
              onChange={(e) => setForm({ ...form, foodOptions: e.target.value })}
              placeholder='[{"name":"Pizza Place","type":"Dinner","address":"123 Main St"}]'
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTrip(null);
                setForm(EMPTY_TRIP);
              }}
              className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : editingTrip ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      )}

      {/* Trip Cards */}
      {trips.length === 0 ? (
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-8 text-center">
          <div className="text-4xl mb-3">✈️</div>
          <p className="text-slate-400 text-sm">No trips scheduled yet.</p>
          <button
            onClick={() => {
              setShowForm(true);
              setForm(EMPTY_TRIP);
            }}
            className="mt-3 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            + Plan a trip
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => {
            const foodOptions = parseFoodOptions(trip.foodOptions);
            return (
              <div
                key={trip.id}
                className="bg-[#0d1526] rounded-xl border border-white/10 p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {trip.destination}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          getStatus(trip) === 'upcoming'
                            ? 'bg-green-500/20 text-green-400'
                            : getStatus(trip) === 'current'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {getStatus(trip) === 'upcoming'
                          ? 'Upcoming'
                          : getStatus(trip) === 'current'
                          ? 'In Progress'
                          : 'Past'}
                      </span>
                    </h3>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(trip)}
                      className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {trip.checkIn && (
                    <div>
                      <span className="text-slate-500 text-xs">Check In</span>
                      <p className="text-white">{formatDate(trip.checkIn)}</p>
                    </div>
                  )}
                  {trip.checkOut && (
                    <div>
                      <span className="text-slate-500 text-xs">Check Out</span>
                      <p className="text-white">{formatDate(trip.checkOut)}</p>
                    </div>
                  )}
                  {trip.departTime && (
                    <div>
                      <span className="text-slate-500 text-xs">Depart</span>
                      <p className="text-white">{trip.departTime}</p>
                    </div>
                  )}
                  {trip.returnTime && (
                    <div>
                      <span className="text-slate-500 text-xs">Return</span>
                      <p className="text-white">{trip.returnTime}</p>
                    </div>
                  )}
                </div>

                {(trip.hotelName || trip.hotelAddress || trip.hotelPhone) && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-500 mb-1">Hotel</p>
                    <p className="text-sm text-white">{trip.hotelName}</p>
                    {trip.hotelAddress && (
                      <p className="text-xs text-slate-400">{trip.hotelAddress}</p>
                    )}
                    {trip.hotelPhone && (
                      <p className="text-xs text-slate-400">{trip.hotelPhone}</p>
                    )}
                  </div>
                )}

                {foodOptions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-500 mb-2">Food Options</p>
                    <div className="flex flex-wrap gap-2">
                      {foodOptions.map((opt, i) => (
                        <span
                          key={i}
                          className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-lg border border-yellow-500/20"
                        >
                          {opt.name || opt.place || `Option ${i + 1}`}
                          {opt.type ? ` (${opt.type})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {trip.notes && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{trip.notes}</p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/5">
                  <Link
                    to={`/events?destination=${encodeURIComponent(trip.destination)}`}
                    className="text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    View associated events →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
