# Personal Expense Tracker

A full-stack web application for tracking personal expenses. Users manage transactions by category, set monthly budgets, and receive real-time WebSocket alerts when spending crosses threshold values (50%, 80%, 100%).

## Tech Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL
- **Auth:** Google OAuth 2.0 + GitHub OAuth (via Passport.js)
- **Real-time:** WebSocket

---

## Getting Started

> Full setup instructions coming after implementation is complete.

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
cp .env.example .env
# fill in your env vars
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# fill in your env vars
npm install
npm run dev
```

### Tests

```bash
cd backend
npm run test
```

---

## Environment Variables

See `backend/.env.example` for all required variables.

---

_Full documentation will be added in Phase 10._
