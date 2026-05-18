import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { format, parseISO } from 'date-fns';

const APPOINTMENT_TYPES = [
  { value: 'OFFICE_VISIT', label: 'Office Visit with Coach', icon: '🏛️', desc: 'One-on-one with your coach to discuss performance, concerns, or team matters' },
  { value: 'TRAINING_SESSION', label: '1:1 Training Session', icon: '💪', desc: 'Personalized training with a coach focused on skill development' },
  { value: 'ATHLETIC_TRAINING', label: 'Athletic Training Visit', icon: '🩺', desc: 'Injury prevention, rehab, or treatment with the athletic trainer' },
  { value: 'SPORTS_PSYCHOLOGY', label: 'Sports Psychology', icon: '🧠', desc: 'Mental performance coaching — focus, confidence, and resilience' },
];

const TYPE_COLORS = {
  OFFICE_VISIT: 'border-l-blue-500 bg-blue-500/10',
  TRAINING_SESSION: 'border-l-purple-500 bg-purple-500/10',
  ATHLETIC_TRAINING: 'border-l-green-500 bg-green-500/10',
  SPORTS_PSYCHOLOGY: 'border-l-orange-500 bg-orange-500/10',
};

const TYPE_BADGE = {
  OFFICE_VISIT: 'bg-blue-500/20 text-blue-400',
  TRAINING_SESSION: 'bg-purple-500/20 text-purple-400',
  ATHLETIC_TRAINING: 'bg-green-500/20 text-green-400',
  SPORTS_PSYCHOLOGY: 'bg-orange-500/20 text-orange-400',
};

const STATUS_BADGE = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  COMPLETED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function BookAppointments() {
  const { user, isCoach } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    type: 'OFFICE_VISIT',
    title: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments');
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Book a new appointment
  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookingForm.title.trim() || !bookingForm.startTime) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/appointments', {
        title: bookingForm.title.trim(),
        type: bookingForm.type,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: bookingForm.endTime ? new Date(bookingForm.endTime).toISOString() : null,
        notes: bookingForm.notes || undefined,
      });
      setBookingForm({ type: 'OFFICE_VISIT', title: '', startTime: '', endTime: '', notes: '' });
      setShowBooking(false);
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  // Cancel an appointment
  const handleCancel = async (id) => {
    try {
      await api.patch(`/appointments/${id}`, { status: 'CANCELLED' });
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel');
    }
  };

  // Coach: confirm an appointment
  const handleConfirm = async (id) => {
    try {
      await api.patch(`/appointments/${id}`, { status: 'CONFIRMED' });
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm');
    }
  };

  const upcoming = appointments.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED');
  const past = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isCoach
              ? 'Manage bookings and requests from your athletes'
              : 'Book time with your coach, trainer, or sports psychologist'}
          </p>
        </div>
        {!isCoach && (
          <button
            onClick={() => {
              setShowBooking(!showBooking);
              setError(null);
            }}
            className="flex-shrink-0 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
          >
            {showBooking ? '← Back' : '+ Book Appointment'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Booking Form */}
      {showBooking && !isCoach && (
        <div className="bg-[#0d1526] border border-green-500/30 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Book a New Appointment</h2>
          <form onSubmit={handleBook} className="space-y-4">
            {/* Appointment Type */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Appointment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {APPOINTMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setBookingForm({ ...bookingForm, type: t.value })}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      bookingForm.type === t.value
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl block mb-1">{t.icon}</span>
                    <p className="text-xs font-medium text-white">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Discuss season goals, ankle checkup..."
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date/time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End (optional)</label>
                <input
                  type="datetime-local"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
              <textarea
                placeholder="Anything you want your coach to know ahead of time..."
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Booking…' : 'Confirm Booking →'}
            </button>
          </form>
        </div>
      )}

      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          📅 Upcoming {upcoming.length > 0 && <span className="text-white">· {upcoming.length}</span>}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400 text-sm animate-pulse">Loading appointments…</div>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-slate-400 text-sm">No upcoming appointments</p>
            {!isCoach && (
              <button
                onClick={() => setShowBooking(true)}
                className="mt-3 text-sm text-green-400 hover:text-green-300 font-medium"
              >
                Book one now →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border-l-4 p-4 ${TYPE_COLORS[a.type] || 'border-l-slate-500 bg-white/5'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[a.type] || ''}`}>
                        {APPOINTMENT_TYPES.find((t) => t.value === a.type)?.label || a.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[a.status] || ''}`}>
                        {a.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(parseISO(a.startTime), 'EEE, MMM d · h:mm a')}
                      {a.endTime && ` – ${format(parseISO(a.endTime), 'h:mm a')}`}
                    </p>
                    {(a.notes || a.athlete?.name) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {a.athlete?.name && !isCoach && (
                          <span className="text-xs text-slate-500">With {a.athlete.name}</span>
                        )}
                        {a.athlete?.name && isCoach && (
                          <span className="text-xs text-slate-500">{a.athlete.name}</span>
                        )}
                        {a.notes && (
                          <span className="text-xs text-slate-400 italic">"{a.notes}"</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    {isCoach && a.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleConfirm(a.id)}
                          className="text-xs px-3 py-1.5 bg-green-600/80 hover:bg-green-600 rounded-lg font-medium transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(a.id)}
                          className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {!isCoach && a.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Appointments */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            📄 Past
          </h2>
          <div className="space-y-2">
            {past.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-700/30 bg-[#1e2d4a]/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[a.type] || ''}`}>
                        {APPOINTMENT_TYPES.find((t) => t.value === a.type)?.label || a.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[a.status] || ''}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(parseISO(a.startTime), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
