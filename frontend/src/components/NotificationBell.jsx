import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getStoredNotifications,
  markAllRead,
  isConfigured,
  requestNotificationPermission,
} from '../lib/firebase';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [permissionState, setPermissionState] = useState('default'); // 'default' | 'granted' | 'denied'
  const [enabling, setEnabling] = useState(false);
  const dropdownRef = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  const refresh = useCallback(() => {
    setNotifications(getStoredNotifications());
  }, []);

  useEffect(() => {
    refresh();

    // Check current permission
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }

    // Listen for new incoming notifications (foreground)
    const handler = () => refresh();
    window.addEventListener('cadence:notification', handler);
    return () => window.removeEventListener('cadence:notification', handler);
  }, [refresh]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      await requestNotificationPermission();
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
    } finally {
      setEnabling(false);
    }
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  markAllRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Enable prompt — show if Firebase configured but permission not granted */}
          {isConfigured && permissionState !== 'granted' && permissionState !== 'denied' && (
            <div className="px-4 py-3 border-b border-white/10 bg-green-500/5">
              <p className="text-xs text-gray-400 mb-2">Get real-time alerts for schedule changes.</p>
              <button
                onClick={handleEnable}
                disabled={enabling}
                className="w-full text-xs bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {enabling ? 'Enabling…' : '🔔 Enable Push Notifications'}
              </button>
            </div>
          )}

          {permissionState === 'denied' && isConfigured && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-white/10">
              <p className="text-xs text-gray-500">
                Notifications blocked. Enable them in your browser settings.
              </p>
            </div>
          )}

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-600 text-xs mt-1">Schedule alerts will appear here</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${
                    !n.read ? 'bg-green-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    )}
                    <div className={!n.read ? '' : 'ml-3.5'}>
                      <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{n.body}</p>}
                      <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer — clear all */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  localStorage.removeItem('cadence_notifications');
                  setNotifications([]);
                }}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
