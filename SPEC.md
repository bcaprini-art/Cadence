# Cadence — App Spec

## Overview
A scheduling coordination platform for college athletics. Matches athlete class/personal schedules with coach practice and game schedules. Handles NCAA/NAIA compliance (CARA hour limits). Built for all college athletics programs.

## Stack
- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite + Tailwind CSS
- Auth: JWT (multi-tenant by school)
- Jobs: Bull queue (background processing)
- Notifications: Firebase FCM (push) + SendGrid (email)

## User Roles
- **Athlete** — enters/syncs class schedule, blocks personal time, views practice schedule
- **Coach** — creates practices/games/travel, sees team availability heatmap, gets conflict alerts
- **Athletic Director** — cross-sport facility scheduling, compliance oversight
- **Admin** — manages rosters, integrations, school settings

## Data Model

### Users & Teams
- Users (id, name, email, role, sport, team_id, school_id)
- Teams (id, sport, division, school_id, compliance_ruleset_id)
- Schools (id, name, timezone, conference)

### Schedules
- ScheduleBlocks (id, user_id, title, start, end, type: CLASS|STUDY|PERSONAL|ATHLETIC, is_hard_block, visibility: PUBLIC|BUSY|PRIVATE, source: MANUAL|SIS_SYNC|CALENDAR_SYNC)
- Events (id, team_id, title, start, end, type: PRACTICE|GAME|TRAVEL|FILM|MEETING, venue_id, created_by)
- EventAttendees (event_id, user_id, status: REQUIRED|OPTIONAL|EXCUSED)

### Compliance
- ComplianceRulesets (id, division: D1|D2|D3|NAIA|NJCAA, max_cara_hours_day, max_cara_hours_week, dead_week_rules, mandatory_rest_hours)
- CARALog (id, athlete_id, event_id, hours, week_start)

### Venues
- Venues (id, school_id, name, type: GYM|FIELD|POOL|COURT, capacity)
- VenueBookings (id, venue_id, start, end, event_id)

## Conflict Detection (3-pass algorithm)
1. **Hard Block Check** — interval overlap: `start < proposed_end AND end > proposed_start`
2. **CARA Compliance** — rolling 7-day sum of athletic hours per athlete vs ruleset limits
3. **Availability Scoring** — `score = (available/total)*0.5 + (1-cara_util)*0.3 + venue_avail*0.2`

## FERPA Privacy Rules
- Coaches NEVER see athlete class names or personal block titles — only "BUSY"
- Redaction happens at API layer, not frontend
- Athletes must consent before SIS sync

## Project Structure
- /backend — Node.js API
- /frontend — React web app
- /compliance — Compliance rules engine (shared library)
