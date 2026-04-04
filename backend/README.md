# AthletiSync Backend

Node.js + Express + Prisma + PostgreSQL API for the AthletiSync college athletics scheduling platform.

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Redis (for Bull job queues — optional for core API)

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/athletisync
JWT_SECRET=your-very-long-random-secret-here
PORT=3001
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

### 3. Set up the database

```bash
# Push schema to database (development)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 4. Seed demo data

```bash
npm run db:seed
```

This creates:
- Lakewood University (demo school)
- 2 teams: Basketball (D1) and Soccer (D2)
- 1 coach per team, 5 athletes per team
- Sample schedule blocks, events, CARA logs
- Compliance rulesets for D1, D2, D3, NAIA, NJCAA

**Demo accounts:**

| Email | Password | Role |
|-------|----------|------|
| admin@lakewood.edu | admin123 | ADMIN |
| coach.harris@lakewood.edu | coach123 | COACH (Basketball) |
| coach.rivera@lakewood.edu | coach123 | COACH (Soccer) |
| jordan.lee@lakewood.edu | athlete123 | ATHLETE (Basketball) |
| mia.chen@lakewood.edu | athlete123 | ATHLETE (Soccer) |

### 5. Start the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login → returns JWT |

All other routes require `Authorization: Bearer <token>` header.

### Schools

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/schools | Any |
| GET | /api/schools/:id | Any |
| POST | /api/schools | ADMIN |
| PATCH | /api/schools/:id | ADMIN |
| DELETE | /api/schools/:id | ADMIN |

### Teams

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/teams | Any |
| GET | /api/teams/:id | Any |
| POST | /api/teams | AD, ADMIN |
| PATCH | /api/teams/:id | AD, ADMIN |
| DELETE | /api/teams/:id | ADMIN |

### Users

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/users/me | Any |
| GET | /api/users | COACH, AD, ADMIN |
| GET | /api/users/:id | Any (athletes: own only) |
| PATCH | /api/users/:id | Own or ADMIN |

Query: `?teamId=<id>` to filter by team.

### Schedule Blocks

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/schedule-blocks | Any (FERPA-scoped) |
| GET | /api/schedule-blocks/:id | Any (FERPA-scoped) |
| POST | /api/schedule-blocks | Any |
| PATCH | /api/schedule-blocks/:id | Owner or Admin |
| DELETE | /api/schedule-blocks/:id | Owner or Admin |

**FERPA note:** Coaches see only `title: "BUSY"` for CLASS, STUDY, and PERSONAL blocks.  
Query: `?teamId=<id>`, `?userId=<id>`, `?start=<ISO>`, `?end=<ISO>`

### Events

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/events | Any |
| GET | /api/events/:id | Any |
| POST | /api/events | COACH, AD, ADMIN |
| PATCH | /api/events/:id | COACH, AD, ADMIN |
| DELETE | /api/events/:id | COACH, AD, ADMIN |
| GET | /api/events/:id/attendees | Any |
| POST | /api/events/:id/attendees | COACH, AD, ADMIN |
| PATCH | /api/events/:id/attendees/:userId | COACH, AD, ADMIN |
| DELETE | /api/events/:id/attendees/:userId | COACH, AD, ADMIN |

### Venues

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/venues | Any |
| GET | /api/venues/:id | Any |
| POST | /api/venues | AD, ADMIN |
| PATCH | /api/venues/:id | AD, ADMIN |
| DELETE | /api/venues/:id | ADMIN |

### Conflict Check

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/conflict-check | COACH, AD, ADMIN |

**Body:**
```json
{
  "teamId": "team_basketball",
  "start": "2025-11-04T15:00:00Z",
  "end": "2025-11-04T17:00:00Z",
  "venueId": "venue_gym"
}
```

**Response:**
```json
{
  "hardConflicts": [...],
  "caraViolations": [...],
  "suggestedWindows": [
    { "start": "...", "end": "...", "score": 0.87, "availableCount": 4 }
  ],
  "summary": {
    "hasConflicts": true,
    "conflictCount": 2,
    "caraViolationCount": 0,
    "topWindowScore": 0.87
  }
}
```

### CARA Log

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/cara-log | Any |
| POST | /api/cara-log | COACH, AD, ADMIN |

Query: `?athleteId=<id>`, `?teamId=<id>`, `?weeks=4`

---

## Architecture

### 3-Pass Conflict Detection Engine

Located at `src/lib/conflictEngine.js`

1. **Pass 1 — Hard Block Overlap**: SQL interval query (`start < end AND end > start`) finds athletes with hard blocks during the proposed window.

2. **Pass 2 — CARA Compliance**: Rolling 7-day sum of athletic hours per athlete vs. division ruleset limits (daily + weekly). Adds proposed event duration to current totals.

3. **Pass 3 — Availability Scoring**: 30-minute sliding window over a 7-day lookahead. Scores windows using: `(available/total)*0.5 + (1 - cara_util)*0.3 + venue_avail*0.2`. Returns top 3 candidates.

### FERPA Privacy Layer

The `ferpaSerializer` middleware intercepts `res.json()` for coach-role requests. CLASS, STUDY, and PERSONAL blocks have their titles replaced with `"BUSY"` — redaction happens at the API layer, never the frontend.

### Real-time (Socket.IO)

Connect and join a team room to receive live schedule updates:

```javascript
socket.emit('join:team', teamId)
```

---

## Prisma Schema Notes

Uses Prisma v7 config pattern:
- `prisma.config.ts` — datasource URL via `defineConfig()`
- `schema.prisma` — NO `url` in datasource block (Prisma v7 style)

Run `npm run db:studio` to open Prisma Studio.
