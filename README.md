# Cadence 🏟️

**College athletics scheduling, built for modern athletic departments.**

Cadence helps coaches, athletic directors, and student-athletes manage complex schedules across sports, venues, and compliance windows — all in one place.

---

## Features

- 📅 **Schedule Builder** — Drag-and-drop event scheduling with conflict detection
- 🏟️ **Venue Management** — Track facility availability across multiple venues
- 👥 **Team Coordination** — Multi-sport support with role-based access (coaches, ADs, athletes)
- 📱 **Push Notifications** — Real-time alerts via Firebase for schedule changes
- 📋 **Compliance Engine** — NCAA practice hour limits and rule enforcement
- 📧 **Email Notifications** — Automated emails via SendGrid for key events
- 🔒 **Auth System** — JWT-based auth with role management
- 📊 **PDF Export** — Generate printable schedules and reports

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Users                      │
└─────────────┬───────────────────────────────┘
              │ HTTPS
┌─────────────▼───────────────────────────────┐
│              CloudFront CDN                  │
│  (SSL termination, edge caching)             │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│        Application Load Balancer             │
│  /api/* → backend   /*  → frontend           │
└──────────┬──────────────────┬───────────────┘
           │                  │
┌──────────▼──────┐  ┌───────▼────────────┐
│  ECS Backend    │  │  ECS Frontend      │
│  Node.js/Express│  │  nginx + React SPA │
│  Port 4001      │  │  Port 80           │
└──────────┬──────┘  └────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│           RDS PostgreSQL 16                  │
│  (Multi-AZ in production)                    │
└─────────────────────────────────────────────┘

External Services:
  Firebase     → Push notifications
  SendGrid     → Email delivery
```

---

## Quick Start (Local Dev)

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or use Docker for the DB)
- npm

### 1. Clone and install

```bash
git clone https://github.com/your-org/cadence.git
cd cadence
```

### 2. Set up backend

```bash
cd backend
cp .env.example .env
# Edit .env with your local database URL and JWT secret
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

### 3. Set up frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your API URL
npm install
npm run dev
```

### 4. Or use the dev script

```bash
./scripts/start-dev.sh
```

Visits [http://localhost:5173](http://localhost:5173) automatically.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Required | Description                              |
|--------------------|----------|------------------------------------------|
| `DATABASE_URL`     | ✅       | PostgreSQL connection string             |
| `JWT_SECRET`       | ✅       | Secret for signing JWT tokens            |
| `PORT`             | ✅       | Server port (default: 4001)             |
| `CLIENT_URL`       | ✅       | Frontend origin for CORS                |
| `SENDGRID_API_KEY` | ⚠️       | Email delivery (leave blank to skip)    |
| `FIREBASE_PROJECT_ID` | ⚠️   | Push notifications (leave blank to skip)|

### Frontend (`frontend/.env.local`)

| Variable       | Required | Description                   |
|---------------|----------|-------------------------------|
| `VITE_API_URL` | ✅      | Backend API URL               |

See `.env.production.example` for a full production variable reference.

---

## Scripts

| Script                    | Description                              |
|--------------------------|------------------------------------------|
| `scripts/start-dev.sh`   | Start backend + frontend for local dev  |
| `scripts/start-prod.sh`  | Start production stack via Docker       |
| `scripts/migrate.sh`     | Run Prisma database migrations           |
| `scripts/seed.sh`        | Seed the database with initial data      |
| `scripts/backup-db.sh`   | Create a dated pg_dump backup           |

---

## Deployment

Cadence deploys to AWS via GitHub Actions on every push to `main`.

**Quick deploy summary:**
1. Push to `main` → CI runs tests
2. Docker images built and pushed to ECR
3. ECS service updated with new task definition
4. CloudFront serves the updated frontend

**Full setup guide:** [infrastructure/aws/setup-guide.md](./infrastructure/aws/setup-guide.md)

**AWS services used:**
- ECS Fargate (containers)
- RDS PostgreSQL (database)
- ECR (Docker image registry)
- CloudFront (CDN + SSL)
- Secrets Manager (credentials)
- CloudWatch (logs + monitoring)

---

## Tech Stack

| Layer       | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, CSS Modules       |
| Backend    | Node.js 20, Express, Prisma ORM   |
| Database   | PostgreSQL 16                     |
| Auth       | JWT (jsonwebtoken + bcryptjs)     |
| Real-time  | Socket.io                         |
| Email      | SendGrid                          |
| Push       | Firebase Cloud Messaging          |
| Container  | Docker, Docker Compose            |
| CI/CD      | GitHub Actions                    |
| Hosting    | AWS ECS Fargate + CloudFront      |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and commit: `git commit -m "feat: add my feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request against `main`

**Commit convention:** Use [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, etc.

**PRs to `main` trigger CI** (tests + Docker build). Merging to `main` triggers full deploy.

---

## License

Private — all rights reserved.
