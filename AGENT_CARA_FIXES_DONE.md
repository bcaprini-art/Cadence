# CARA Compliance Improvements — Done

**Completed:** 2026-04-04  
**All 3 fixes implemented + seed data updated + frontend build ✅**

---

## Fix 1 — "Make Optional" Toggle on Events

### Backend
- Added `isVoluntary Boolean @default(false)` to `Event` model in `prisma/schema.prisma`
- Migration applied: `20260404183625_add_event_voluntary`
- New endpoint: `PATCH /api/events/:id/voluntary` (COACH/AD/ADMIN only)
  - Only works on `FILM` and `MEETING` event types
  - When set to `true`: deletes all CARALog entries for the event
  - When set to `false`: recreates CARALog entries for all REQUIRED attendees
  - Returns updated event object

### Frontend
- `Compliance.jsx`: Added "Optional Activity Toggle" section
  - Shows all FILM/MEETING events for the selected week
  - Toggle switch per event; disabled during async save
  - 📌 "Voluntary" badge on marked events
  - Tooltip on hover explaining voluntary = non-countable
  - Compliance summary auto-reloads after toggle (CARA hours update immediately)
- `api.js`: Added `eventsAPI.setVoluntary(id, isVoluntary)`

---

## Fix 2 — CARA Forecast View

### Backend
- New endpoint: `GET /api/compliance/forecast?teamId=X&weekStart=YYYY-MM-DD`
- Returns per-athlete forecast combining:
  - Current logged CARA hours (from CARALog)
  - Upcoming countable events this week (non-voluntary, in the future)
- Per-athlete fields: `currentHours`, `scheduledHours`, `projectedHours`, `limit`, `remainingHours`, `projectedRemaining`, `status`, `dailyBreakdown`, `upcomingEvents`
- Status levels: `ok` / `warning` (>85%) / `risk` (>95%) / `violation` (≥100%)
- Smart insights: auto-generates messages for athletes projected to exceed limits
- Uses team's actual `ComplianceRuleset` from DB

### Frontend
- New page: `src/pages/coach/CARAForecast.jsx`
  - **Top summary cards**: Total athletes / On Track / Warning >85% / At Risk >95%
  - **Smart Insights panel**: Yellow alert box listing athletes at risk of exceeding limits with actionable suggestions
  - **Per-athlete rows**: Expandable with:
    - Avatar + name + status badge
    - Mini day grid (Mon-Sun) with colored bars
    - CARA split-bar meter (solid = logged, striped = upcoming scheduled)
    - List of upcoming countable events
  - **Week navigation**: prev/next week buttons
  - Sorted by `projectedHours` descending
- `Layout.jsx`: Added `{ path: '/cara-forecast', label: 'CARA Forecast', icon: '📊' }` to `coachNav`
- `App.jsx`: Added `/cara-forecast` → `PrivateRoute` → `CARAForecast`
- `Home.jsx`: Added CARA Forecast card to coach actions grid
- `api.js`: Added `complianceAPI.getForecast(teamId, weekStart)`

---

## Fix 3 — CARA-Aware Scheduling Suggestions

### Backend
- `conflictEngine.js`: Added `generateCARASmartSuggestions(teamId, start, end, caraViolations)`
  - **"shorten"** suggestion: finds max safe duration (all athletes stay compliant), rounds down to nearest 15 min
  - **"exclude"** suggestion: lists athletes at weekly limit; suggests running without them
  - Integrated into `runConflictCheck()` — `smartSuggestions` now in all conflict check responses
- `conflictCheck.js`: `smartSuggestions` added to `POST /api/conflict-check` response

### Frontend
- `CoachPrompts.jsx`: Added `SmartSuggestionCard` component
  - Renders below main prompts with "🧠 CARA Smart Suggestions" header
  - ✂️ Shorten card: shows alt duration + savings
  - 👤 Exclude card: shows at-risk athletes with their current hours
  - "Apply" button calls `onSmartAction` callback
- `ScheduleEvent.jsx`: Passes `smartSuggestions` to `CoachPrompts`
  - "Shorten" action: pre-fills the `endTime` field with the shorter duration, clears result so coach can re-check

---

## Seed Data Fix

- `prisma/seed.js`: Updated to be fully idempotent (upserts throughout)
  - Events: use `upsert` instead of `create`
  - Schedule blocks: delete-then-recreate
  - CARA logs: delete existing before creating
- Basketball athletes now seeded with varied hours: **9h / 13h / 16h / 18h / 19.5h**
- Soccer athletes: **8h / 12h / 14h / 17h / 18h**
- Re-run: `node prisma/seed.js` ✅

---

## Files Changed

### Backend
- `prisma/schema.prisma` — added `isVoluntary` field
- `prisma/migrations/20260404183625_add_event_voluntary/` — new migration
- `prisma/seed.js` — idempotent + varied CARA hours
- `src/routes/events.js` — added `PATCH /:id/voluntary`
- `src/routes/compliance.js` — added `GET /forecast`
- `src/lib/conflictEngine.js` — added `generateCARASmartSuggestions`, updated `runConflictCheck`
- `src/routes/conflictCheck.js` — added `smartSuggestions` to response

### Frontend
- `src/lib/api.js` — added `eventsAPI.setVoluntary`, `complianceAPI.getForecast`
- `src/pages/coach/CARAForecast.jsx` — new file
- `src/pages/coach/Compliance.jsx` — added optional events toggle section
- `src/components/CoachPrompts.jsx` — added `SmartSuggestionCard`, `smartSuggestions` prop
- `src/pages/coach/ScheduleEvent.jsx` — passes `smartSuggestions` + `onSmartAction`
- `src/components/Layout.jsx` — added CARA Forecast nav item
- `src/App.jsx` — added `/cara-forecast` route
- `src/pages/Home.jsx` — added CARA Forecast coach action card

---

## Build Status
```
✓ frontend build: 413 modules transformed, 0 errors
✓ backend modules: all load OK
✓ prisma migration: applied cleanly
✓ seed: ran successfully with varied CARA hours
```
