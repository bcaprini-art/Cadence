import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (iso) => {
    try {
      const d = parseISO(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return format(d, 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT_BOOKED': return '📅';
      case 'APPOINTMENT_STATUS': return '✅';
      case 'EVENT_CREATED': return '🆕';
      case 'EVENT_UPDATED': return '✏️';
      case 'EVENT_DELETED': return '🗑️';
      default: return '🔔';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-sm animate-pulse">Loading notifications…</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-12 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-400 text-sm">No notifications yet</p>
          <p className="text-slate-500 text-xs mt-2">
            You'll get notified when appointments are booked, schedules change, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) handleMarkRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl transition-colors cursor-pointer ${
                !n.read
                  ? 'bg-green-500/5 border border-green-500/20 hover:bg-green-500/10'
                  : 'bg-transparent hover:bg-white/5'
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{getTypeIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-white' : 'text-slate-300'}`}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                {n.body && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.body}</p>
                )}
                <p className="text-[10px] text-slate-600 mt-1">{formatTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
