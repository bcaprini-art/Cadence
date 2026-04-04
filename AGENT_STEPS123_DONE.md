# Steps 1–3 Complete — Frontend Wired to Real Backend APIs

**Build status:** ✅ Clean (0 errors, 0 warnings)
**Date:** 2026-04-04

---

## What Was Done

### api.js — Updated (`src/lib/api.js`)
- Fixed route paths to match actual backend routes (`/schedule-blocks`, `/conflict-check`, `/events`, `/teams`)
- Renamed exports to: `scheduleAPI`, `eventsAPI`, `conflictAPI`, `teamAPI`, `complianceAPI`
- Removed dead `scheduleAPI.getMyBlocks` (wrong path), replaced with `scheduleAPI.getBlocks(params)`

---

### Step 1: Athlete Schedule Entry (`pages/athlete/MySchedule.jsx`)

- **Replaced** `mockBlocks` / `mockEvents` with live API calls
- `useEffect` + `useCallback` fetches both blocks and events for the current week on mount and on `weekOffset` change
- `AddBlockModal` now calls `scheduleAPI.createBlock()` via POST, handles loading + error states
- `toggleVisibility` does optimistic update → `PATCH /api/schedule-blocks/:id` → reverts on failure
- `deleteBlock` does optimistic remove → `DELETE /api/schedule-blocks/:id` → re-fetches on failure
- Week navigation (`weekOffset`) re-fetches data each time
- Loading spinner and error banner with Retry button
- Empty state with "Add your first block" prompt

**API field mapping note:** Backend uses `isHardBlock` (camelCase) not `is_hard_block`. Form was updated accordingly.

---

### Step 2: Conflict Check (`pages/coach/ScheduleEvent.jsx`)

- **Replaced** `mockConflictResult` with real `conflictAPI.check()` call
- Builds ISO datetimes from date + time fields before POST
- Added team selector (auto-selects if coach has only one team) via `teamAPI.getTeams()`
- Displays real `hardConflicts[]`, `caraViolations[]`, `suggestedWindows[]` from backend
- Green/yellow/red UI based on `hardConflicts.length > 0` / `caraViolations.length > 0`
- "Confirm & Schedule" calls `eventsAPI.createEvent()` → shows success screen with event details
- Inline validation (end must be after start, teamId required)
- Error banner for both conflict-check and event-create failures

**Response shape used:**
```json
{
  "hardConflicts": [{ "athleteName", "blockType", ... }],
  "caraViolations": [{ "athleteName", "projectedHours", "limit", ... }],
  "suggestedWindows": [{ "start", "end", "score", "availableCount" }],
  "summary": { "conflictCount", "caraViolationCount" }
}
```

---

### Step 3: Live Heatmap (`pages/coach/TeamAvailability.jsx`)

- **Replaced** `generateHeatmapData()` with real `scheduleAPI.getBlocks({ teamId, start, end })` call
- `buildHeatmap()` function groups blocks by date + 30-min slot, counts conflicts per slot
- Team picker dropdown (auto-selects first team; shows dropdown if multiple teams)
- Week navigation (Prev / This Week / Next) with date range label
- Color scale unchanged: green ≥90%, yellow ≥70%, orange ≥40%, red <40%
- Graceful fallback: "No availability data found for this week" if API returns empty
- Loading spinner, error banner with Retry
- Selected-slot detail panel shows real unavailable athletes with reason

---

### Athlete Dashboard (`pages/athlete/Dashboard.jsx`)

- **Replaced** `mockBlocks` / `mockEvents` with real API calls
- Fetches today's blocks + 7 days of events in parallel via `Promise.all`
- `todayBlocks` / `todayEvents` filtered client-side from fetched data
- `upcoming` = next 5 events after now, sorted ascending
- Loading state, error banner
- Empty states for both "Today's Schedule" and "Upcoming Events" sections
- Stats row shows real counts (today's items, upcoming count, total blocks this week)

---

## Key Notes

- All pages use the existing `api.js` axios client (JWT headers attached automatically)
- Backend uses camelCase for Prisma fields (`isHardBlock`, not `is_hard_block`)
- The `user` object from `useAuth()` contains `teamId` for athlete-scoped queries
- FERPA serializer in backend will redact block titles for coaches (shows type/BUSY instead)
- Build is clean — no mock imports remain in the four modified files
