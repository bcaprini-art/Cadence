# Cadence — Steps 4 & 5 Complete ✅

**Completed by:** Subagent `cadence-steps-4-5`
**Date:** 2026-04-04

---

## Step 4: Email Notifications (SendGrid) ✅

### What was built
- **`backend/src/lib/email.js`** — Full email service with 4 functions:
  - `sendPracticeScheduled(coach, athletes, event)` — athletes notified when practice created
  - `sendConflictAlert(coach, conflicts, event)` — coach notified of hard conflicts
  - `sendScheduleChange(athletes, event, changeType)` — athletes notified of updates/cancellations
  - `sendCARAWarning(coach, athlete, hours, limit)` — coach warned when athlete near CARA limit

### Email design
- Dark navy HTML templates matching Cadence brand (`#0a0f1e` background, `#0f172a` card)
- Green gradient CTA buttons with "View in Cadence" links
- Responsive, tested with SendGrid-compatible inline styles
- Event info blocks with date/time/venue, color-coded conflict tables, CARA progress bars

### Wired into routes
- **`src/routes/events.js`** POST — fires `sendPracticeScheduled` after event creation
- **`src/routes/events.js`** PATCH — fires `sendScheduleChange('UPDATED')` after update
- **`src/routes/events.js`** DELETE — fetches event + attendees first, then fires `sendScheduleChange('CANCELLED')`
- **`src/routes/conflictCheck.js`** POST — fires `sendConflictAlert` when hard conflicts found

### Graceful fallback
- If `SENDGRID_API_KEY` is not set, logs to console instead of sending
- All sends are **fire-and-forget** (`.catch(console.error)`) — never blocks request

### Environment vars added to `.env.example`
```
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@cadence.app
```

---

## Step 5: Google Calendar Sync ✅

### What was built

#### Backend — `backend/src/routes/calendar.js`
- `GET /api/calendar/auth` — Redirects to Google OAuth consent (requires `?token=<jwt>` or Bearer header)
- `GET /api/calendar/callback` — Handles OAuth callback, stores tokens via upsert, redirects to frontend
- `GET /api/calendar/sync` — Fetches 30 days of Google Calendar events, creates `ScheduleBlock` records (deduplication by title+time), returns `{ created, skipped, total, syncedAt }`
- `GET /api/calendar/status` — Returns `{ connected, lastSynced }` for current user
- `DELETE /api/calendar/disconnect` — Revokes Google token, removes DB record

#### Prisma schema — `backend/prisma/schema.prisma`
- Added `GoogleToken` model: `userId (unique), accessToken, refreshToken, expiresAt`
- Added `googleToken GoogleToken?` relation to `User` model
- Migration applied: `20260404175756_add_google_token`

#### Token refresh
- Automatic: if token expires within 5 minutes, refresh is attempted before making API calls
- Falls back gracefully if refresh fails (returns 401 → user prompted to reconnect)

#### Event type inference
- Keywords in event title automatically map to `CLASS`, `STUDY`, or `PERSONAL` block types
- All synced blocks use `source: 'CALENDAR_SYNC'` for identification

#### Auth middleware update — `backend/src/middleware/auth.js`
- Now accepts token from both `Authorization: Bearer` header AND `?token=` query param
- Required for the OAuth redirect flow where headers aren't available

### Frontend

#### `frontend/src/pages/athlete/MySchedule.jsx` (updated)
- **"Sync Google Calendar"** button (green, prominent) — appears in header action bar
- If not connected: button redirects to `/api/calendar/auth?token=<jwt>`
- If connected: button calls `GET /api/calendar/sync`, shows success/error banner, refreshes blocks
- Shows **"Last synced X ago"** when previously synced
- Shows **"Disconnect"** link to remove Google auth
- Synced blocks show a **Google Calendar icon indicator** (blue border + GCal icon badge)
- Fetches `/api/calendar/status` on mount to restore connected state

#### `frontend/src/pages/CalendarCallback.jsx` (new)
- Handles `/calendar/callback` route
- Shows loading spinner, success confirmation, or error state
- Auto-redirects to `/my-schedule` after 2.5s on success
- Error state offers "Back" and "Try Again" buttons

#### `frontend/src/App.jsx` (updated)
- Added: `<Route path="/calendar/callback" element={<PrivateRoute><CalendarCallback /></PrivateRoute>} />`

### Environment vars added to `.env.example`
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4001/api/calendar/callback
```

---

## Testing Notes

### To test email (Step 4):
1. Add your SendGrid API key to `backend/.env`
2. Create an event via `POST /api/events` — athletes on the team will receive emails
3. Run a conflict check via `POST /api/conflict-check` with conflicting blocks — coach gets alert

### To test Google Calendar (Step 5):
1. Create a Google Cloud project, enable Calendar API, create OAuth 2.0 credentials
2. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to `backend/.env`
3. In Cadence, navigate to "My Schedule" as an athlete
4. Click "Sync Google Calendar" — authorizes and syncs events as schedule blocks

### Without API keys:
- Email: logs to console instead of sending ✅
- Google Calendar: `/api/calendar/auth` returns 503 with helpful message ✅

---

## Files Modified / Created

### Backend
| File | Action |
|------|--------|
| `src/lib/email.js` | **Created** |
| `src/routes/calendar.js` | **Created** |
| `src/routes/events.js` | Modified (email hooks) |
| `src/routes/conflictCheck.js` | Modified (conflict alert hook) |
| `src/middleware/auth.js` | Modified (query param token support) |
| `src/index.js` | Modified (mount `/api/calendar`) |
| `prisma/schema.prisma` | Modified (GoogleToken model) |
| `.env.example` | Modified (new vars) |
| `prisma/migrations/20260404175756_add_google_token/` | **Created** (auto) |

### Frontend
| File | Action |
|------|--------|
| `src/pages/CalendarCallback.jsx` | **Created** |
| `src/pages/athlete/MySchedule.jsx` | Modified (GCal sync UI) |
| `src/App.jsx` | Modified (calendar callback route) |
