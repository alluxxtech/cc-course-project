# Personal Expense Tracker — Project Context

## What This Project Is

A full-stack web application for tracking personal expenses. Users manage transactions by category, set monthly budgets, and receive real-time WebSocket alerts when spending crosses threshold values (50%, 80%, 100%).

Full requirements: see `SPEC.MD` in the project root.
Implementation plan with task checklist: see `PLAN.MD` in the project root.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React), TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache / Sessions | Redis |
| Job Queue | BullMQ (Redis-based) |
| Real-time | WebSocket via `@nestjs/websockets` |
| Authentication | Passport.js — Google OAuth 2.0 + GitHub OAuth |
| Testing | Jest (backend), React Testing Library (frontend) |

---

## Project Structure (expected)

```
/
├── backend/          # NestJS application
│   ├── src/
│   │   ├── auth/     # Passport strategies, session, guards
│   │   ├── users/    # User entity and service
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   └── websocket/  # Budget alert gateway
│   └── test/
├── frontend/         # Next.js application
│   ├── app/ (or pages/)
│   └── components/
├── SPEC.MD
└── README.md
```

---

## Core Domain Rules

### Users & Auth
- SSO only — Google OAuth and GitHub OAuth, no username/password
- User identity = `provider` + `provider_user_id` (not email — GitHub may not return it)
- On first sign-in, backend auto-creates the user record
- Session persists across page refreshes
- Each user sees only their own data — authorization enforced on every request

### Categories
- CRUD per user; name unique per user
- Chosen deletion behavior (one of two — documented in README):
  - **Block**: cannot delete if transactions exist
  - **Reassign**: transactions move to auto-created `Uncategorized` category

### Transactions
- Fields: `title` (required), `amount` > 0 (required), `currency` (required, single for MVP), `date` (required), `category_id` (required, must belong to user), `notes` (optional)
- Full CRUD

### Monthly Budget
- Set per (user, year, month)
- Metrics: total spent, remaining, usage %
- If no budget set — show explicit "No budget set" state, never show misleading zeros

### WebSocket Budget Alerts
- Server pushes alerts when current-month spending crosses 50% / 80% / 100%
- Each threshold fires **at most once per month** — persisted in `budget_alert_triggers` table
- Alerts re-evaluated: on WS connection open + after any transaction mutation
- No alerts if no budget set for current month
- Client must send at least one meaningful message (`subscribe` or `ack`) that affects server behavior

---

## Database Schema (PostgreSQL)

```sql
users
  id, provider, provider_user_id, email (nullable), display_name, avatar_url, created_at, updated_at

categories
  id, user_id FK, name, created_at, updated_at
  UNIQUE(user_id, name)

transactions
  id, user_id FK, category_id FK, title, amount, currency, date, notes, created_at, updated_at

monthly_budgets
  id, user_id FK, year, month, amount, created_at, updated_at
  UNIQUE(user_id, year, month)

budget_alert_triggers
  id, user_id FK, year, month, threshold (50|80|100), triggered_at
  UNIQUE(user_id, year, month, threshold)
```

---

## Required Environment Variables

```env
DATABASE_URL=
REDIS_HOST=
REDIS_PORT=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SESSION_SECRET=
FRONTEND_URL=
```

---

## Backend Conventions (NestJS)

- Auth guard on all endpoints except `/auth/*`
- Authorization checked per resource — never trust client-provided user IDs
- Input validation: `class-validator` + `class-transformer` on all DTOs
- Consistent error response format across all endpoints
- WebSocket gateway authenticates connections at handshake (session cookie or JWT)

---

## Testing Requirements

Minimum 7 test cases:
1. SSO login success path (mocked provider — no real Google/GitHub calls)
2. Create category
3. Create transaction
4. Authorization: user cannot access another user's data
5. WebSocket alert at 50%
6. WebSocket alert at 80%
7. WebSocket alert at 100%

---

## UI Requirements Summary

- Login screen: Google + GitHub buttons only
- Dashboard: monthly budget widget (total / remaining / usage %), month selector
- Transactions screen: list/table + search + filters (category, date range, amount range)
- Categories screen: CRUD list
- Real-time alert UI: toast / banner / notification panel
- Empty states required for: no transactions, no categories, no search results, no budget set
- At least one loading state visible on a main screen
- Client-side form validation with error messages
- Light theme only, responsive (table → cards on narrow screens)

---

## README Must Include

- How to run backend and frontend locally
- How to run tests
- API overview
- Category deletion behavior choice + explanation
- Google OAuth setup instructions
- GitHub OAuth setup instructions
- WebSocket message format and alert rules
