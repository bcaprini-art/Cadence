# Cadence — Security Hardening & Automated Tests

**Completed by:** cadence-security-tests subagent  
**Date:** 2026-04-04

---

## Part 1: Security Hardening (Backend)

### Packages Installed
- `helmet` — security HTTP headers
- `express-rate-limit` — brute-force & DDoS protection
- `express-validator` — input validation
- `xss-clean` — XSS protection
- `hpp` — HTTP Parameter Pollution prevention

### Changes Made

#### `src/index.js`
- Added `helmet()`, `xss()`, `hpp()` middleware (runs before all routes)
- Applied `authLimiter` to `/api/auth` routes (10 req / 15 min)
- Applied `apiLimiter` to all `/api` routes (200 req / 15 min)
- Added `GET /api/security/status` endpoint (ADMIN only) → `{ helmet: true, rateLimiting: true, xssProtection: true }`

#### `src/middleware/rateLimiter.js` _(new)_
- `authLimiter`: 10 attempts / 15 min on auth routes
- `apiLimiter`: 200 requests / 15 min on all API routes
- Both use `standardHeaders: true, legacyHeaders: false`

#### `src/middleware/validate.js` _(new)_
Validation chains using `express-validator`:
- `validateLogin` — email format, password min 6 chars
- `validateRegister` — name required, email format, password min 8 chars + uppercase + digit
- `validateScheduleBlock` — title ≤100 chars, valid BlockType enum, ISO dates, end > start
- `validateEvent` — title ≤100 chars, valid EventType enum, ISO dates, teamId required, end > start
- `validateConflictCheck` — teamId required, ISO dates, end > start
- `validate` middleware — runs chain, returns 400 with error array if invalid

#### `src/middleware/auditLog.js` _(new)_
- FERPA audit logging to `logs/audit.log`
- Records: timestamp, coachId, athleteId(s), endpoint, method, action
- Uses `fs.appendFileSync` — no extra deps
- `logs/` directory is auto-created if missing; errors are silently swallowed (non-fatal)
- Applied to `GET /api/schedule-blocks` and `GET /api/schedule-blocks/:id` when accessed by COACH role

#### `src/routes/scheduleBlocks.js`
- Added `auditLog('GET_SCHEDULE_BLOCKS')` middleware to GET `/`
- Added `auditLog('GET_SCHEDULE_BLOCK_BY_ID')` middleware to GET `/:id`

---

## Part 2: Automated Tests (Backend)

### Packages Installed (devDependencies)
- `jest` — test runner
- `supertest` — HTTP integration testing

### `package.json` test script
```
"test": "jest --testPathPattern=src/__tests__ --runInBand --forceExit"
```

### Test Files Created (`src/__tests__/`)

#### `setup.js`
- Shared test helper — overrides `DATABASE_URL` with `TEST_DATABASE_URL` when set
- `makeToken(userOverrides)` — generates signed JWTs without DB access
- Exports shared `prisma` client

#### `conflictEngine.test.js` ✅ 12/12 tests passing (pure unit, no DB)
- No-overlap cases (before, after)
- Overlap: partial, contained, contains
- Edge cases: adjacent blocks (ends when other starts — NOT overlapping)
- CARA: 18h + 3h = violation (>20h D1 limit)
- CARA: 16h + 3h = no violation (19h < 20h)
- CARA: fractional hours, exact-limit cases

#### `auth.test.js` (requires DB)
- Register: success, duplicate email (409), missing fields (400 each)
- Login: success, wrong password (401), non-existent user (401)
- Protected routes: no token → 401, invalid token → 401, valid token → 200

#### `scheduleBlocks.test.js` (requires DB)
- Create block — success (201)
- Athlete cannot create block for another user (403)
- Athlete sees only own blocks
- Other athlete does not see first athlete's blocks
- Coach sees team blocks (FERPA serializer applies)
- Delete own block — success (200)
- Delete another user's block — 403

#### `compliance.test.js` (requires DB)
- CARA forecast returns correct structure (weekStart, weekEnd, limit, athletes, totals)
- Forecast is 403 for ATHLETE role
- Forecast is 400 when teamId missing
- Voluntary toggle: mark FILM as voluntary → isVoluntary=true
- Un-voluntary toggle: isVoluntary=false
- Invalid isVoluntary value → 400
- CSV export returns `text/csv` content-type
- CSV has `content-disposition: attachment` header with `.csv` filename

---

## Part 3: Frontend Error Boundaries

#### `frontend/src/components/ErrorBoundary.jsx` _(new)_
- React class component using `getDerivedStateFromError` + `componentDidCatch`
- Sport-themed fallback: 🏟️ icon, "Something went wrong" heading
- "Try again" button — resets error state (re-renders children)
- "Reload page" button — hard reload as escape hatch
- In dev mode (`import.meta.env.DEV`): shows error message + component stack
- Styled with Tailwind (dark theme matching app)

#### `frontend/src/main.jsx`
- Wrapped entire app with `<ErrorBoundary>` outside BrowserRouter

---

## Verification

| Check | Status |
|-------|--------|
| `npm run build` (frontend) | ✅ Passes — 414 modules, no errors |
| `conflictEngine.test.js` | ✅ 12/12 passing |
| Middleware syntax check | ✅ All modules load OK |
| `src/index.js` syntax | ✅ `node --check` passes |
| DB-dependent tests (auth, scheduleBlocks, compliance) | ⚠️ Require running PostgreSQL — run with `TEST_DATABASE_URL` set |

---

## Running Tests

```bash
cd backend

# Unit tests only (no DB required)
npx jest src/__tests__/conflictEngine.test.js

# All tests (requires PostgreSQL)
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/cadence_test npm test
```

> Add `TEST_DATABASE_URL` to your `.env` file for convenient local testing.
