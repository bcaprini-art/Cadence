import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { conflictAPI, eventsAPI, teamAPI } from '../../lib/api'
import CoachPrompts from '../../components/CoachPrompts'
import api from '../../lib/api'

// Duration presets
const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '90 min', value: 90 },
  { label: '2 hr', value: 120 },
]

export default function ScheduleEvent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({
    title: '',
    type: 'PRACTICE',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    teamId: '',
  })

  // Conflict check result
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState(null)

  // Confirm flow
  const [pendingWindow, setPendingWindow] = useState(null) // window selected from CoachPrompts
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  // Quick Suggest
  const [suggestDuration, setSuggestDuration] = useState(60)
  const [customDuration, setCustomDuration] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState(null)
  const [suggestions, setSuggestions] = useState(null) // array of { coachPrompts, window, ... }
  const [showSuggest, setShowSuggest] = useState(false)

  useEffect(() => {
    teamAPI.getTeams()
      .then(({ data }) => {
        setTeams(data)
        if (data.length === 1) setForm((f) => ({ ...f, teamId: data[0].id }))
      })
      .catch(() => {})
  }, [])

  const buildISO = (date, time) => {
    if (!date || !time) return null
    return new Date(`${date}T${time}:00`).toISOString()
  }

  // ── Manual conflict check ───────────────────────────────────────────────────
  const checkConflicts = async (e) => {
    e.preventDefault()
    setCheckError(null)
    setResult(null)
    setConfirmed(null)
    setPendingWindow(null)
    setSuggestions(null)

    const start = buildISO(form.date, form.startTime)
    const end = buildISO(form.date, form.endTime)

    if (!start || !end) { setCheckError('Please fill in date and time fields.'); return }
    if (new Date(end) <= new Date(start)) { setCheckError('End time must be after start time.'); return }
    if (!form.teamId) { setCheckError('Please select a team.'); return }

    setChecking(true)
    try {
      const { data } = await conflictAPI.check({
        teamId: form.teamId,
        start,
        end,
        type: form.type,
        venue: form.venue,
      })
      setResult({ ...data, _start: start, _end: end })
    } catch (err) {
      setCheckError(err.response?.data?.error || 'Conflict check failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  // ── Quick Suggest ───────────────────────────────────────────────────────────
  const findBestTimes = async () => {
    if (!form.teamId) { setSuggestError('Please select a team first.'); return }
    const duration = suggestDuration === 'custom' ? Number(customDuration) : suggestDuration
    if (!duration || duration <= 0) { setSuggestError('Enter a valid duration.'); return }

    setSuggestError(null)
    setSuggestions(null)
    setResult(null)
    setPendingWindow(null)
    setSuggesting(true)

    try {
      const { data } = await api.post('/conflict-check/suggest', {
        teamId: form.teamId,
        durationMinutes: duration,
        lookAheadDays: 7,
        type: form.type,
        venue: form.venue,
      })
      setSuggestions(data.suggestions)
    } catch (err) {
      setSuggestError(err.response?.data?.error || 'Could not find suggestions. Try again.')
    } finally {
      setSuggesting(false)
    }
  }

  // ── Coach picks a window from prompts ──────────────────────────────────────
  const handleSelectWindow = (window) => {
    const startDt = new Date(window.start)
    const endDt = new Date(window.end)

    // Auto-fill the form date/time
    setForm((f) => ({
      ...f,
      date: format(startDt, 'yyyy-MM-dd'),
      startTime: format(startDt, 'HH:mm'),
      endTime: format(endDt, 'HH:mm'),
    }))

    setPendingWindow(window)
    setResult(null)
    setSuggestions(null)

    // Scroll to top of form
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  // ── Confirm & create event ─────────────────────────────────────────────────
  const confirmSchedule = async () => {
    if (!pendingWindow && !result) return

    const start = pendingWindow
      ? new Date(pendingWindow.start).toISOString()
      : result._start
    const end = pendingWindow
      ? new Date(pendingWindow.end).toISOString()
      : result._end

    setConfirming(true)
    try {
      const { data } = await eventsAPI.createEvent({
        teamId: form.teamId,
        title: form.title || 'Practice',
        type: form.type,
        start,
        end,
      })
      setConfirmed(data)
    } catch (err) {
      setCheckError(err.response?.data?.error || 'Failed to create event.')
    } finally {
      setConfirming(false)
    }
  }

  // ── Flatten suggestions into a single prompts array for CoachPrompts ───────
  const flatSuggestionPrompts = suggestions
    ? suggestions.flatMap((s) =>
        (s.coachPrompts || []).filter((p) => p.severity !== 'blocked')
      )
    : null

  // ── Success screen ─────────────────────────────────────────────────────────
  if (confirmed) {
    const startFmt = format(parseISO(confirmed.start), 'EEEE, MMM d · h:mm a')
    const endFmt = format(parseISO(confirmed.end), 'h:mm a')
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center">
        <div className="bg-[#0d1526] rounded-2xl border border-green-500/30 p-10 max-w-md text-center shadow-2xl">
          <div className="text-5xl mb-4">🟢</div>
          <h2 className="text-2xl font-bold text-white mb-2">Practice scheduled!</h2>
          <p className="text-gray-300 mb-1 font-medium">{confirmed.title}</p>
          <p className="text-sm text-gray-400 mb-1">{startFmt} – {endFmt}</p>
          <p className="text-xs text-green-400 mb-6">Athletes will be notified.</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setConfirmed(null)
                setResult(null)
                setPendingWindow(null)
                setSuggestions(null)
                setForm({ title: '', type: 'PRACTICE', date: '', startTime: '', endTime: '', venue: '', teamId: form.teamId })
              }}
              className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/5"
            >
              Schedule Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Pending confirmation screen ────────────────────────────────────────────
  if (pendingWindow) {
    const startDt = new Date(pendingWindow.start)
    const endDt = new Date(pendingWindow.end)
    return (
      <PageShell logout={logout} navigate={navigate}>
        <h1 className="text-2xl font-bold mb-6">Confirm & Schedule</h1>
        <div className="bg-[#0d1526] rounded-xl border border-green-500/30 p-6 space-y-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">✅</div>
            <div>
              <p className="font-semibold text-white">{form.title || 'Untitled Event'}</p>
              <p className="text-sm text-gray-400">
                {format(startDt, 'EEEE, MMMM d')} · {format(startDt, 'h:mm a')} – {format(endDt, 'h:mm a')}
              </p>
            </div>
          </div>

          {form.venue && (
            <p className="text-sm text-gray-400">📍 {form.venue}</p>
          )}

          {checkError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {checkError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={confirmSchedule}
              disabled={confirming}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {confirming ? 'Scheduling…' : `Confirm & Schedule →`}
            </button>
            <button
              onClick={() => setPendingWindow(null)}
              className="flex-1 py-3 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/5"
            >
              ← Back
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <PageShell logout={logout} navigate={navigate}>
      <h1 className="text-2xl font-bold mb-6">Schedule an Event</h1>

      {/* ── Event details form ── */}
      <form onSubmit={checkConflicts} className="bg-[#0d1526] rounded-xl border border-white/10 p-6 space-y-4 mb-4">
        {checkError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {checkError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Team */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Team</label>
            <select
              required
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.sport}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Morning Practice"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Event Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {['PRACTICE', 'GAME', 'TRAVEL', 'FILM', 'MEETING'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Venue */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Venue (optional)</label>
            <input
              type="text"
              placeholder="Main Gymnasium"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* ── Quick Suggest section ── */}
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowSuggest(!showSuggest)}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium mb-3"
          >
            <span>🪄</span>
            <span>Find Best Times</span>
            <span className="text-xs text-gray-500 font-normal ml-1">— let Cadence pick for you</span>
            <span className="ml-auto text-xs text-gray-500">{showSuggest ? '▲' : '▼'}</span>
          </button>

          {showSuggest && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-3">
              <p className="text-xs text-gray-400">
                Choose a duration and Cadence will scan the next 7 days for the best available windows.
              </p>

              {/* Duration presets */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => { setSuggestDuration(p.value); setCustomDuration('') }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        suggestDuration === p.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSuggestDuration('custom')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      suggestDuration === 'custom'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {suggestDuration === 'custom' && (
                  <input
                    type="number"
                    min="15"
                    max="480"
                    placeholder="Minutes"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="mt-2 w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              {suggestError && (
                <p className="text-xs text-red-400">{suggestError}</p>
              )}

              <button
                type="button"
                onClick={findBestTimes}
                disabled={suggesting || !form.teamId}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {suggesting ? 'Searching…' : '🪄 Find Best Times'}
              </button>
            </div>
          )}
        </div>

        {/* ── Manual time entry + Check button ── */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-gray-500 mb-3">Or pick a specific time:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={checking || !form.date || !form.startTime || !form.endTime}
            className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {checking ? 'Checking conflicts…' : 'Check Availability & Conflicts'}
          </button>
        </div>
      </form>

      {/* ── Quick suggest results ── */}
      {flatSuggestionPrompts && flatSuggestionPrompts.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
            🪄 Best times this week
          </p>
          <CoachPrompts prompts={flatSuggestionPrompts} onSelect={handleSelectWindow} />
        </div>
      )}

      {/* ── Conflict check CoachPrompts ── */}
      {result && result.coachPrompts && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
            Scheduling Advisor
          </p>
          <CoachPrompts
            prompts={result.coachPrompts}
            smartSuggestions={result.smartSuggestions || []}
            onSelect={handleSelectWindow}
            onSmartAction={(suggestion) => {
              if (suggestion.type === 'shorten' && suggestion.altDurationMinutes) {
                // Adjust end time based on alt duration
                const newEnd = new Date(new Date(result._start).getTime() + suggestion.altDurationMinutes * 60 * 1000)
                const d = new Date(result._start)
                const hours = String(newEnd.getHours()).padStart(2, '0')
                const mins = String(newEnd.getMinutes()).padStart(2, '0')
                setForm((f) => ({ ...f, endTime: `${hours}:${mins}` }))
                setResult(null)
              }
            }}
          />

          {/* If all clear, show direct confirm */}
          {result.coachPrompts.length === 1 && result.coachPrompts[0].severity === 'clear' && (
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => handleSelectWindow({ start: result._start, end: result._end })}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                Confirm & Schedule →
              </button>
              <button
                onClick={() => setResult(null)}
                className="py-3 px-5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/5"
              >
                Adjust
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fallback: no coachPrompts from older API response */}
      {result && !result.coachPrompts && (
        <LegacyResult result={result} onConfirm={confirmSchedule} confirming={confirming} onClear={() => setResult(null)} />
      )}
    </PageShell>
  )
}

// ── Page shell (nav/header) ─────────────────────────────────────────────────
function PageShell({ children, logout, navigate }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="bg-[#0d1526] border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center font-bold text-black text-sm">C</div>
            <span className="text-xl font-bold">Cadence</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <button onClick={() => navigate('/dashboard')} className="hover:text-white">Dashboard</button>
            <button onClick={() => navigate('/team-availability')} className="hover:text-white">Availability</button>
            <button onClick={() => navigate('/schedule-event')} className="text-white font-medium">Schedule</button>
            <button onClick={() => navigate('/roster')} className="hover:text-white">Roster</button>
            <button onClick={() => navigate('/compliance')} className="hover:text-white">Compliance</button>
          </nav>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300">Sign out</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

// ── Legacy fallback for old API response format (no coachPrompts) ───────────
function LegacyResult({ result, onConfirm, confirming, onClear }) {
  const hasHard = result.hardConflicts?.length > 0
  const hasCara = result.caraViolations?.length > 0
  const statusColor = hasHard
    ? 'border-red-500/40 bg-red-500/5'
    : hasCara
    ? 'border-yellow-500/40 bg-yellow-500/5'
    : 'border-green-500/40 bg-green-500/5'

  return (
    <div className={`rounded-xl border p-6 ${statusColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{hasHard ? '🔴' : hasCara ? '🟡' : '🟢'}</div>
        <div>
          <h2 className="font-semibold">{hasHard ? 'Hard Conflicts Detected' : hasCara ? 'CARA Violations' : 'All Clear!'}</h2>
          <p className="text-sm text-gray-400">
            {result.summary.conflictCount} hard conflict{result.summary.conflictCount !== 1 ? 's' : ''} ·{' '}
            {result.summary.caraViolationCount} CARA violation{result.summary.caraViolationCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onConfirm} disabled={confirming} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium disabled:opacity-50">
          {confirming ? 'Scheduling…' : 'Confirm & Schedule'}
        </button>
        <button onClick={onClear} className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/5">
          Adjust Time
        </button>
      </div>
    </div>
  )
}
