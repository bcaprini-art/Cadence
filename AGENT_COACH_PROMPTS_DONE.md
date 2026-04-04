# Scheduling Advisor — Coach Prompts Feature Complete

**Date:** 2026-04-04  
**Build status:** ✅ `npm run build` passes clean

---

## What Was Built

### 1. `backend/src/lib/scheduleAdvisor.js` — Smart Recommendation Engine

New module that converts raw conflict engine output into ranked, plain-English coach prompts.

**Logic paths:**
- **All clear** → 1 prompt: "✅ All clear — great time to schedule" with full team available, no CARA concerns, venue confirmation
- **Soft conflicts only (CARA warnings, no hard blocks)** → 1 prompt: "⚠️ Minor conflicts — workable" noting athletes are close to CARA limit but not blocked
- **Hard conflicts** → Blocked prompt for proposed time + ranked alternatives from suggestedWindows:
  - 🚫 Can't schedule here — N athletes have conflicts (FERPA: first name only, no reason)
  - ✅ Best alternative — N/N athletes free
  - 👍 Good option — N/N athletes free, minor trade-offs
  - 🕐 Backup option — N/N athletes free
- **CARA near-limit warnings** → Added to any prompt when athlete is >85% of weekly limit
- **GAME / TRAVEL event notes** → Rest window reminder for GAME, travel-hours logging note for TRAVEL

**FERPA compliance:** athlete first name only shown in conflict lists, never the reason they're busy.

---

### 2. `backend/src/routes/conflictCheck.js` — Updated Conflict Check Route

- Imports `generateCoachPrompts` from scheduleAdvisor
- After conflict engine runs, fetches roster from DB, calls `generateCoachPrompts`
- Adds `coachPrompts: [...]` array to every response
- Passes `type` and `venue` from request body into prompt generation

**New endpoint: `POST /api/conflict-check/suggest`**
- Body: `{ teamId, durationMinutes, lookAheadDays?, venueId?, type? }`
- Batch-fetches all hard blocks and CARA logs for the search window (avoids N+1 queries)
- Slides a `durationMinutes` window through next 7 days in 30-min increments
- Scores each slot: `availabilityRatio × 0.5 + (1 - caraUtil) × 0.3 + 0.2`
- Returns top 3 slots, each with full `runConflictCheck` result + `coachPrompts`

---

### 3. `frontend/src/components/CoachPrompts.jsx` — Card UI

Beautiful card-based component with:
- Color-coded borders: 🔴 red (blocked) / 🟡 yellow (warning) / 🟢 green (clear)
- Animated fade/slide-in on mount (staggered per card)
- "⭐ Recommended" badge on best option
- Score badge top-right
- Window time displayed in monospace
- Bullet-point details list
- Confirm button calling `onSelect(window)` (disabled/absent for blocked cards)
- Best option card slightly scaled up with ring highlight

**Props:** `{ prompts, onSelect(window) }`

---

### 4. `frontend/src/pages/coach/ScheduleEvent.jsx` — Wired Up

Full rewrite of the coach scheduling page:

- **CoachPrompts replaces** the old raw conflict display
- Selecting a window auto-fills form date/time and shows a clean "Confirm & Schedule" review screen
- Confirm step POSTs to `/api/events` and shows success: "Practice scheduled for [date/time]. Athletes will be notified."
- Legacy fallback for old API response shape (no `coachPrompts`)
- Extracted `PageShell` component for cleaner code

---

### 5. `frontend/src/pages/coach/ScheduleEvent.jsx` — 🪄 Quick Suggest

**"Find Best Times" button** added before manual time entry:

1. Coach fills in: event title, type, duration (preset buttons: 30min / 1hr / 90min / 2hr / Custom), venue
2. Clicks "🪄 Find Best Times" — collapsible panel
3. POSTs to `/api/conflict-check/suggest`
4. Returns top 3 `CoachPrompts` automatically
5. Coach clicks one → form auto-fills → confirm screen → create event

Duration presets render as toggle buttons; Custom shows a numeric minutes input.

---

### 6. `frontend/src/lib/api.js` — Added `conflictAPI.suggest`

```js
export const conflictAPI = {
  check: (data) => api.post('/conflict-check', data),
  suggest: (data) => api.post('/conflict-check/suggest', data),
}
```

---

## Files Changed

| File | Status |
|------|--------|
| `backend/src/lib/scheduleAdvisor.js` | ✨ New |
| `backend/src/routes/conflictCheck.js` | ✏️ Updated |
| `frontend/src/components/CoachPrompts.jsx` | ✨ New |
| `frontend/src/pages/coach/ScheduleEvent.jsx` | ✏️ Rewritten |
| `frontend/src/lib/api.js` | ✏️ Updated |

## Tests Run

- `node -e` smoke test of `generateCoachPrompts` with all three logic paths — all pass
- `npm run build` in frontend — ✅ clean, 412 modules, no errors
