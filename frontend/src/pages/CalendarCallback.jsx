/**
 * CalendarCallback.jsx
 * Handles the /calendar/callback route after Google OAuth redirect.
 * Reads ?success=true or ?error=<msg> from the query string,
 * shows appropriate UI, then redirects to /my-schedule.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      setMessage('Google Calendar connected! Redirecting to your schedule...');
      const timer = setTimeout(() => navigate('/my-schedule'), 2500);
      return () => clearTimeout(timer);
    } else if (error) {
      const errorMessages = {
        access_denied: 'You denied access to Google Calendar.',
        token_exchange_failed: 'Failed to complete authentication. Please try again.',
        not_configured: 'Google Calendar integration is not configured on this server.',
        invalid_state: 'Invalid authentication state. Please try again.',
        missing_params: 'Missing authentication parameters. Please try again.',
      };
      setStatus('error');
      setMessage(errorMessages[error] || `Authentication failed: ${error}`);
    } else {
      // No params — probably landed here directly, redirect
      navigate('/my-schedule', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-green-600 to-green-700 rounded-xl px-5 py-2.5 mb-4">
            <span className="text-xl font-bold text-white tracking-tight">⚡ Cadence</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
          {status === 'loading' && (
            <>
              <div className="w-14 h-14 rounded-full border-4 border-green-500/30 border-t-green-500 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Connecting...</h2>
              <p className="text-slate-400 text-sm">Completing Google Calendar authentication</p>
            </>
          )}

          {status === 'success' && (
            <>
              {/* Google Calendar icon + checkmark */}
              <div className="relative inline-flex mb-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <GoogleCalendarIcon className="w-9 h-9" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Calendar Connected!</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Redirecting to your schedule...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/my-schedule')}
                  className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors"
                >
                  Back to My Schedule
                </button>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('cadence_token');
                    window.location.href = `/api/calendar/auth?token=${token}`;
                  }}
                  className="w-full py-3 rounded-xl border border-slate-600/50 text-slate-300 hover:border-slate-500 font-medium text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Cadence — College Athletics Scheduling
        </p>
      </div>
    </div>
  );
}

// Inline Google Calendar SVG icon
function GoogleCalendarIcon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3H7C5.9 3 5 3.9 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#4285F4" />
      <path d="M12 13.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm0 1.5c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5z" fill="white" />
      <rect x="8" y="1.5" width="2" height="4" rx="1" fill="#34A853" />
      <rect x="14" y="1.5" width="2" height="4" rx="1" fill="#34A853" />
    </svg>
  );
}
