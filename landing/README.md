# Cadence — Marketing Landing Page

A standalone marketing landing page for Cadence, the college athletics scheduling platform. Built with Vite + vanilla JS + Tailwind CSS (CDN).

## Stack

- **Vite** — fast dev server + build tool
- **Tailwind CSS** — via CDN (no build step for styles needed)
- **Vanilla JS** — no framework overhead
- **Intersection Observer** — smooth scroll-triggered fade-in animations

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (runs on port 5174)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs on **port 5174** to avoid conflicts with the main Cadence app on port 5173.

## Project Structure

```
landing/
├── index.html          # Main HTML — all sections
├── vite.config.js      # Vite config (port 5174)
├── package.json        # Dependencies + scripts
├── favicon.svg         # Green "C" favicon
├── src/
│   ├── main.js         # Scroll reveal, heatmap, form logic
│   └── style.css       # Custom styles + animation classes
└── README.md           # This file
```

## Sections

1. **Hero** — Headline + CTAs + CSS-drawn availability heatmap mockup
2. **Problem** — Three pain points (conflicts, violations, missed comms)
3. **How It Works** — Three-step process
4. **Features** — 6-card feature grid
5. **Divisions** — D1, D2, D3, NAIA, NJCAA badges
6. **Early Access** — Email form with localStorage persistence
7. **Footer** — Logo, links, copyright

## Key Behaviors

- **Scroll animations**: `fade-in` + `stagger-N` classes trigger via IntersectionObserver
- **Early access form**: Saves email to `localStorage` key `cadence_early_access_email`, shows success state (persists on reload)
- **Heatmap mockup**: Dynamically generated CSS grid showing a realistic availability pattern with hover tooltips
- **Smooth scroll**: All `#anchor` links use smooth scroll behavior

## Design

- Background: `#0a0f1e` (dark navy)
- Accent: `#22c55e` (green-500)
- Font: Inter (Google Fonts)
- Glassmorphism nav with backdrop-blur

## Deployment

Build outputs to `dist/`. Deploy to any static host:

```bash
npm run build
# Upload ./dist to Netlify, Vercel, S3, etc.
```
