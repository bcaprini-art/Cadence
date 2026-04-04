# Step 6 Complete — Push Notifications via Firebase FCM

## Summary

All push notification infrastructure has been implemented for Cadence. The system gracefully degrades when Firebase is not configured — the app works fully without any Firebase credentials.

---

## Backend Changes

### Dependencies
- `firebase-admin` installed in `backend/`

### New Files
- **`src/lib/push.js`** — Firebase Admin push service:
  - `initFirebase()` — initializes Firebase Admin SDK; logs and skips if env vars missing
  - `sendPushToUser(userId, title, body, data)` — sends to all FCM tokens registered by a user; auto-prunes invalid/expired tokens
  - `sendPushToTeam(teamId, title, body, data)` — sends to all team members
  - `sendPushToTeamAthletes(teamId, title, body, data)` — sends to athletes only (role=ATHLETE)
  - All functions are fire-and-forget (never throw)

- **`src/routes/push.js`** — Push token management routes:
  - `POST /api/push/register` — upserts an FCM token for the current user (body: `{ token, platform? }`)
  - `DELETE /api/push/unregister` — removes a token (must belong to the requesting user)

### Modified Files
- **`src/index.js`** — calls `initFirebase()` on startup; mounts `/api/push` routes
- **`src/routes/events.js`** — wired push notifications:
  - After event **creation** → `sendPushToTeamAthletes(teamId, 'New Practice Scheduled', '[title] on [date]')`
  - After event **update** → `sendPushToTeamAthletes(teamId, 'Schedule Update', '[title] has been changed')`
  - After event **deletion** → `sendPushToTeamAthletes(teamId, 'Event Cancelled', '[title] has been cancelled')`
- **`src/routes/caraLog.js`** — after every CARA log entry, checks if weekly total ≥ 85% of limit; if so, pushes `'CARA Alert'` to all coaches on the team
- **`.env.example`** — added `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### Prisma Schema
- Added `Platform` enum (`WEB | IOS | ANDROID`)
- Added `FCMToken` model (id, userId, token, platform, createdAt) with cascade-delete on user removal
- Added `fcmTokens FCMToken[]` relation to `User` model
- Migration applied: `20260404175700_add_fcm_tokens`

---

## Frontend Changes

### Dependencies
- `firebase` (client SDK) installed in `frontend/`

### New Files
- **`public/firebase-messaging-sw.js`** — Service worker for background push messages:
  - Receives Firebase config via `postMessage`
  - Shows native notification when app is in background
  - Handles `notificationclick` to focus/open the app

- **`src/lib/firebase.js`** — Firebase client utilities:
  - `requestNotificationPermission()` — requests browser permission, registers SW, retrieves FCM token, calls backend
  - `registerToken(token)` — POSTs token to `/api/push/register`
  - `unregisterToken(token)` — DELETEs token (use on logout)
  - `setupForegroundListener()` — listens for foreground push messages; stores last 10 in `localStorage`; dispatches `cadence:notification` event
  - `getStoredNotifications()` / `markAllRead()` — localStorage helpers
  - All functions are no-ops when Firebase env vars not set

- **`src/components/NotificationBell.jsx`** — Bell icon in header:
  - Shows unread count badge (green, up to 9+)
  - Dropdown with last 10 notifications from localStorage
  - Marks all read on open
  - Shows "Enable notifications" prompt if Firebase configured but permission not granted
  - Shows "Blocked" message if permission denied
  - "Clear all" footer button
  - Closes on outside click

- **`.env.example`** — added:
  ```
  VITE_FIREBASE_API_KEY=
  VITE_FIREBASE_PROJECT_ID=
  VITE_FIREBASE_MESSAGING_SENDER_ID=
  VITE_FIREBASE_APP_ID=
  VITE_FIREBASE_VAPID_KEY=
  ```

### Modified Files
- **`src/components/Layout.jsx`**:
  - Imports `NotificationBell` and Firebase helpers
  - On user mount: calls `setupForegroundListener()`, checks notification permission
  - Shows dismissable green banner prompting to enable notifications (when Firebase configured + permission default)
  - Renders `<NotificationBell />` in the header next to user info

---

## Setup Instructions (when ready to configure)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Add a Web App, get the client config (API key, project ID, etc.)
4. Generate a VAPID key in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
5. Create a Service Account → download JSON → extract `project_id`, `client_email`, `private_key`
6. Fill in both `.env` files with the values above

---

## Build Status
- ✅ Frontend builds without errors (`vite build` clean)
- ✅ Backend modules load without errors
- ✅ `initFirebase()` gracefully skips when not configured
- ✅ Prisma migration applied successfully
