# Logo Upload + Sport Selection — Completed

**Date:** 2026-04-04

## What Was Built

### Backend

#### Schema
- Added `logoUrl String?` and `division Division?` fields to `School` model
- Migration applied: `20260404182049_add_school_logo`

#### New Files
- `src/lib/upload.js` — multer config: logos stored in `public/uploads/logos/`, JPG/PNG/SVG/WebP only, 5MB max, named `school-{id}-{timestamp}.{ext}`
- `src/lib/sports.js` — Comprehensive list of 35 NCAA/NAIA sports with id, name, emoji icon, gender (M/W/mixed), season (fall/winter/spring)
- `src/routes/sports.js` — `GET /api/sports` (no auth required)

#### Updated Files
- `src/routes/schools.js` — Added `POST /:id/logo`, `DELETE /:id/logo`, updated `GET /:id` to include logoUrl, expanded PATCH/PUT to allow AD role and handle division field
- `src/index.js` — Added static file serving at `/uploads`, mounted `/api/sports` route, imported sports routes

### Frontend

#### New Files
- `src/pages/admin/SchoolSettings.jsx` — Full settings page with:
  - **Logo section:** Circular preview, file upload (POST to `/schools/:id/logo`), loading state, remove button, onError fallback to green "C"
  - **School Info section:** Edit name, conference, timezone, division with PUT save
  - **Sport Selection section:** Grid of sport cards with filter tabs (All/Men's/Women's/Mixed), search box, click-to-add (POST to `/teams`), checkmark for active sports

#### Updated Files
- `src/context/AuthContext.jsx` — Added `school` state, `fetchSchool()` after login/register/init, `refreshSchool()` helper, exports `school` from context
- `src/components/Layout.jsx` — Shows school logo (or green "C" fallback) in header, school name replaces "Cadence" when available, added "⚙️ School Settings" to adminNav
- `src/pages/Home.jsx` — Added "⚙️ School Settings" card to adminActions array
- `src/pages/Register.jsx` — 2-step registration: step 1 = basic info, step 2 = sport picker (searchable grid with filter tabs, fetches `/api/sports`)
- `src/App.jsx` — Added `/admin/settings` → `<SchoolSettings>` (AdminRoute), imported SchoolSettings

## Build Status
✅ `npm run build` passes in frontend (409 modules, no errors)
✅ All backend modules load without errors
✅ Database migration applied successfully
