import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays, formatDistanceToNow } from 'date-fns';
import WeeklyCalendar from '../../components/WeeklyCalendar';
import { scheduleAPI, eventsAPI } from '../../lib/api';
import api from '../../lib/api';

const BLOCK_TYPES = ['CLASS', 'STUDY', 'PERSONAL'];
const VISIBILITY_OPTIONS = ['PUBLIC', 'BUSY', 'PRIVATE'];

const VISIBILITY_INFO = {
  PUBLIC: { label: 'Public', desc: 'Title visible to team', color: 'text-green-400' },
  BUSY:   { label: 'Busy',   desc: 'Shows as BUSY (FERPA)', color: 'text-yellow-400' },
  PRIVATE:{ label: 'Private',desc: 'Hidden from everyone',  color: 'text-red-400' },
};

function AddBlockModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    type: 'CLASS',
    start: '',
    end: '',
    isHardBlock: true,
    visibility: 'BUSY',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await scheduleAPI.createBlock({
        ...form,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
      });
      onAdd(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create block');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Add Schedule Block</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. ECON 201, Study Hall..."
              required
              className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    form.type === t
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                      : 'bg-[#1e2d4a] border border-slate-600/50 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Start</label>
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                required
                className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500/60 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">End</label>
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                required
                className="w-full bg-[#1e2d4a] border border-slate-600/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500/60 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Visibility</label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((v) => (
                <label key={v} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={form.visibility === v}
                    onChange={() => setForm({ ...form, visibility: v })}
                    className="accent-green-500"
                  />
                  <div>
                    <span className={`text-sm font-medium ${VISIBILITY_INFO[v].color}`}>{VISIBILITY_INFO[v].label}</span>
                    <span className="text-xs text-slate-500 ml-2">{VISIBILITY_INFO[v].desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="hard"
              checked={form.isHardBlock}
              onChange={(e) => setForm({ ...form, isHardBlock: e.target.checked })}
              className="accent-green-500 w-4 h-4"
            />
            <label htmlFor="hard" className="text-sm text-slate-300">
              Hard block <span className="text-slate-500">(cannot be overridden)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-600/50 text-slate-400 text-sm hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-white font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Google Calendar icon SVG (inline)
function GoogleCalIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3H7C5.9 3 5 3.9 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#4285F4" />
      <path d="M12 12.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 1.5c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" fill="white" />
      <rect x="8" y="2" width="2" height="4" rx="1" fill="#34A853" />
      <rect x="14" y="2" width="2" height="4" rx="1" fill="#34A853" />
    </svg>
  );
}

export default function MySchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [gcalStatus, setGcalStatus] = useState(null); // { connected, lastSynced }
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [gcalMessage, setGcalMessage] = useState(null);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocksRes, eventsRes] = await Promise.all([
        scheduleAPI.getBlocks({
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
        }),
        eventsAPI.getEvents({
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
        }),
      ]);
      setBlocks(blocksRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch Google Calendar connection status
  const fetchGcalStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/calendar/status');
      setGcalStatus(data);
    } catch {
      // Not connected or not configured — that's fine
      setGcalStatus({ connected: false, lastSynced: null });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchGcalStatus();
  }, [fetchGcalStatus]);

  const handleAdd = (block) => setBlocks((prev) => [...prev, block]);

  const handleSync = async () => {
    setSyncLoading(true);
    await fetchData();
    setSyncLoading(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  // Connect to Google Calendar (redirect to OAuth)
  const handleGcalConnect = () => {
    // Redirect to backend OAuth endpoint — token in localStorage for auth middleware
    const token = localStorage.getItem('cadence_token');
    // The backend /api/calendar/auth uses the JWT from headers, but for redirect
    // we can append it. Backend auth middleware reads from Authorization header,
    // so we open with a short-lived approach: redirect through the backend
    window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/calendar/auth?token=${token}`;
  };

  // Run Google Calendar sync (import events as ScheduleBlocks)
  const handleGcalSync = async () => {
    setGcalSyncing(true);
    setGcalMessage(null);
    try {
      const { data } = await api.get('/calendar/sync');
      setGcalMessage({ type: 'success', text: data.message });
      setGcalStatus((prev) => ({ ...prev, connected: true, lastSynced: new Date().toISOString() }));
      // Refresh blocks to show newly synced ones
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed';
      if (err.response?.status === 401) {
        // Not connected — prompt to connect
        setGcalMessage({ type: 'info', text: 'Connect Google Calendar first.' });
      } else {
        setGcalMessage({ type: 'error', text: msg });
      }
    } finally {
      setGcalSyncing(false);
      setTimeout(() => setGcalMessage(null), 5000);
    }
  };

  const handleGcalDisconnect = async () => {
    if (!window.confirm('Disconnect Google Calendar? Synced blocks will remain.')) return;
    try {
      await api.delete('/calendar/disconnect');
      setGcalStatus({ connected: false, lastSynced: null });
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const toggleVisibility = async (id) => {
    const order = ['PUBLIC', 'BUSY', 'PRIVATE'];
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const nextVisibility = order[(order.indexOf(block.visibility) + 1) % order.length];
    // Optimistic update
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, visibility: nextVisibility } : b));
    try {
      await scheduleAPI.updateBlock(id, { visibility: nextVisibility });
    } catch {
      // Revert on failure
      setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, visibility: block.visibility } : b));
    }
  };

  const deleteBlock = async (id) => {
    // Optimistic update
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    try {
      await scheduleAPI.deleteBlock(id);
    } catch {
      // Re-fetch on failure to restore state
      fetchData();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Schedule</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your class and personal blocks</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Google Calendar Sync */}
          {gcalStatus?.connected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGcalSync}
                disabled={gcalSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-60"
              >
                <GoogleCalIcon />
                {gcalSyncing ? 'Syncing...' : 'Sync Google Calendar'}
              </button>
              {gcalStatus.lastSynced && (
                <span className="text-xs text-slate-500 hidden sm:block">
                  Last synced {formatDistanceToNow(new Date(gcalStatus.lastSynced), { addSuffix: true })}
                </span>
              )}
              <button
                onClick={handleGcalDisconnect}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2"
                title="Disconnect Google Calendar"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleGcalConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors border border-green-500/40"
            >
              <GoogleCalIcon />
              Sync Google Calendar
            </button>
          )}

          <button
            onClick={handleSync}
            disabled={syncLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              syncSuccess
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'border-slate-600/50 bg-[#1e2d4a] text-slate-300 hover:border-slate-500'
            }`}
          >
            {syncLoading ? '⟳ Syncing...' : syncSuccess ? '✓ Synced!' : '⟳ Refresh'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Block
          </button>
        </div>
      </div>

      {/* Google Calendar message banner */}
      {gcalMessage && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          gcalMessage.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : gcalMessage.type === 'error'
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
        }`}>
          <GoogleCalIcon />
          <span>{gcalMessage.text}</span>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 rounded-lg bg-[#1e2d4a] border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
        >
          ←
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className="px-3 py-2 rounded-lg bg-[#1e2d4a] border border-slate-700/50 text-sm text-slate-400 hover:text-white transition-colors"
        >
          This week
        </button>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 rounded-lg bg-[#1e2d4a] border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
        >
          →
        </button>
        <span className="text-sm text-slate-500 ml-1">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="text-xs underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-slate-400 text-sm animate-pulse">Loading schedule...</div>
        </div>
      ) : (
        <>
          {/* Calendar */}
          <WeeklyCalendar
            weekOffset={weekOffset}
            blocks={blocks}
            events={events}
            onCellClick={() => setShowModal(true)}
          />

          {/* Block list */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Your Blocks {blocks.length > 0 && <span className="text-slate-600 font-normal">({blocks.length})</span>}
            </h2>
            {blocks.length === 0 ? (
              <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-6 text-center">
                <p className="text-slate-400 text-sm">No blocks this week</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-sm text-green-400 hover:text-green-300"
                >
                  + Add your first block
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {blocks.map((b) => (
                  <div key={b.id} className={`flex items-center gap-3 bg-[#1e2d4a] border rounded-xl px-4 py-3 ${
                    b.source === 'CALENDAR_SYNC'
                      ? 'border-blue-500/30'
                      : 'border-slate-700/50'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm">{b.title || b.type}</p>
                        {b.source === 'CALENDAR_SYNC' && (
                          <span title="Synced from Google Calendar">
                            <GoogleCalIcon className="w-3.5 h-3.5 opacity-70" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {format(new Date(b.start), 'EEE M/d h:mm a')} – {format(new Date(b.end), 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleVisibility(b.id)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${VISIBILITY_INFO[b.visibility]?.color || 'text-slate-400'}`}
                        title="Click to cycle visibility"
                      >
                        {VISIBILITY_INFO[b.visibility]?.label || b.visibility}
                      </button>
                      {b.isHardBlock && (
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Hard</span>
                      )}
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {showModal && <AddBlockModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
