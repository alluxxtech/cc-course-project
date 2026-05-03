# Personal Expense Tracker — Implementation Plan

Status legend: ✅ Done · ⬜ Pending

---

## Phase 1 — Project Setup & Infrastructure

### 1.1 Repository & Monorepo Structure
- ✅ Initialize git repository
- ✅ Create monorepo structure: `backend/`, `frontend/`, `README.md`
- ✅ Add root `.gitignore` (node_modules, .env, dist, .next)

### 1.2 Backend Bootstrap (NestJS)
- ✅ Initialize NestJS project in `backend/` with TypeScript strict mode
- ✅ Install and configure core dependencies: `@nestjs/config`, `class-validator`, `class-transformer`
- ✅ Create `backend/.env.example` with all required variable names (no values)
- ✅ Set up `.env` file and validate env vars on startup with `@nestjs/config` + Joi
- ✅ Configure global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- ✅ Configure global error response format (exception filter)
- ✅ Set up CORS for frontend URL

### 1.3 Frontend Bootstrap (Next.js)
- ✅ Initialize Next.js project in `frontend/` with TypeScript strict mode and App Router
- ✅ Configure `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- ✅ Set up ESLint with `eslint-plugin-react-hooks` (exhaustive-deps rule)
- ✅ Install and configure Tailwind CSS (or chosen UI library)
- ✅ Set up environment variables (`NEXT_PUBLIC_API_URL`, etc.)

### 1.4 Database Setup
- ✅ Install PostgreSQL locally (or via Docker)
- ✅ Install Prisma in `backend/`
- ✅ Create initial database and user
- ✅ Configure database connection via `DATABASE_URL`

### 1.5 Redis Setup
- ✅ Install Redis locally (or via Docker)
- ✅ Install `ioredis` and `@nestjs/cache-manager` with `cache-manager-ioredis-yet`
- ✅ Install `bullmq` and `@nestjs/bullmq`
- ✅ Configure Redis connection (`REDIS_HOST`, `REDIS_PORT`) via `@nestjs/config`
- ✅ Register `CacheModule` globally with Redis store
- ✅ Register `BullModule` globally with Redis connection

---

## Phase 2 — Database Schema & Migrations

- ✅ Create migration / schema for `users` table
  - `id`, `provider`, `provider_user_id`, `email` (nullable), `display_name`, `avatar_url`, `created_at`, `updated_at`
  - Unique constraint: `(provider, provider_user_id)`
- ✅ Create migration for `categories` table
  - `id`, `user_id` FK, `name`, `created_at`, `updated_at`
  - Unique constraint: `(user_id, name)`
- ✅ Create migration for `transactions` table
  - `id`, `user_id` FK, `category_id` FK, `title`, `amount`, `currency`, `date`, `notes`, `created_at`, `updated_at`
- ✅ Create migration for `monthly_budgets` table
  - `id`, `user_id` FK, `year`, `month`, `amount`, `created_at`, `updated_at`
  - Unique constraint: `(user_id, year, month)`
- ✅ Create migration for `budget_alert_triggers` table
  - `id`, `user_id` FK, `year`, `month`, `threshold` (50|80|100), `triggered_at`
  - Unique constraint: `(user_id, year, month, threshold)`
- ✅ Verify all FK cascades and indexes

---

## Phase 3 — Authentication (SSO)

### 3.1 Backend — Passport.js Setup
- ⬜ Install `passport`, `@nestjs/passport`, `express-session`, `connect-redis`
- ⬜ Install `passport-google-oauth20` and `passport-github2` with types
- ⬜ Create `AuthModule` and `UsersModule`
- ⬜ Implement `UsersService`: `findOrCreate(provider, providerUserId, profile)` — upsert on first sign-in
- ⬜ Implement Google OAuth strategy (`passport-google-oauth20`)
- ⬜ Implement GitHub OAuth strategy (`passport-github2`)
- ⬜ Implement session serialization / deserialization (`serializeUser`, `deserializeUser`)
- ⬜ Create auth routes: `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/github`, `GET /auth/github/callback`
- ⬜ Create `GET /auth/me` — return current user profile
- ⬜ Create `POST /auth/logout` — destroy session
- ⬜ Create `AuthGuard` — protect all non-auth endpoints
- ⬜ Register `AuthGuard` globally, whitelist `/auth/*`

### 3.2 Frontend — Auth Flow
- ⬜ Create login page (`/login`) with "Continue with Google" and "Continue with GitHub" buttons
- ⬜ Implement auth state via Context or Zustand (current user, loading, logout)
- ⬜ Fetch `/auth/me` on app load to restore session
- ⬜ Implement redirect to `/login` if unauthenticated
- ⬜ Implement redirect to dashboard after successful sign-in
- ⬜ Implement logout button in navigation

---

## Phase 4 — Categories

### 4.1 Backend
- ⬜ Create `CategoriesModule`, `CategoriesController`, `CategoriesService`
- ⬜ `POST /categories` — create category (validate unique name per user)
- ⬜ `GET /categories` — list user's categories
- ⬜ `PATCH /categories/:id` — rename category (validate ownership + unique name)
- ⬜ `DELETE /categories/:id` — delete category
  - ⬜ Implement chosen deletion strategy (block OR reassign to `Uncategorized`)
  - ⬜ If reassign: auto-create `Uncategorized` on user creation, prevent its deletion
- ⬜ Authorization: all operations check `category.userId === req.user.id`

### 4.2 Frontend
- ⬜ Create Categories page or modal
- ⬜ List of user's categories with rename and delete actions
- ⬜ Create category form with validation (non-empty, duplicate check)
- ⬜ Empty state: "No categories yet"
- ⬜ Loading state while fetching
- ⬜ Error feedback for duplicate name / blocked deletion

---

## Phase 5 — Transactions

### 5.1 Backend
- ⬜ Create `TransactionsModule`, `TransactionsController`, `TransactionsService`
- ⬜ `POST /transactions` — create transaction (validate all fields, check category ownership)
- ⬜ `GET /transactions` — list user's transactions with query filters:
  - ⬜ Search by `title` and `notes` (case-insensitive, partial match)
  - ⬜ Filter by `category_id`
  - ⬜ Filter by date range (`dateFrom`, `dateTo`), presets: `this_month`, `last_month`
  - ⬜ Filter by amount range (`amountMin`, `amountMax`)
- ⬜ `PATCH /transactions/:id` — edit transaction (validate ownership)
- ⬜ `DELETE /transactions/:id` — delete transaction (validate ownership)
- ⬜ Authorization: all operations check `transaction.userId === req.user.id`

### 5.2 Frontend
- ⬜ Create Transactions page
- ⬜ Transactions list / table with columns: date, title, category, amount, currency, actions
- ⬜ Search input (debounced)
- ⬜ Filter controls: category dropdown, date range selector (presets + custom), amount range inputs
- ⬜ "Add transaction" button
- ⬜ Create / Edit transaction modal or drawer with form:
  - ⬜ Fields: title, amount, currency, date, category, notes
  - ⬜ Client-side validation with error messages
- ⬜ Delete confirmation
- ⬜ Empty state: "No transactions" / "No results for this search"
- ⬜ Loading state

---

## Phase 6 — Monthly Budget

### 6.1 Backend
- ⬜ Create `BudgetsModule`, `BudgetsController`, `BudgetsService`
- ⬜ `PUT /budgets/:year/:month` — set or update budget for the month; invalidate Redis cache
- ⬜ `GET /budgets/:year/:month` — get budget + calculated metrics (cache result in Redis, TTL 60s):
  - Total spent (sum of transactions for the month)
  - Remaining (budget − spent)
  - Usage % (spent / budget × 100)
  - Returns `null` / `{ budgetSet: false }` if no budget configured
- ⬜ Invalidate budget cache key after any transaction mutation (create / update / delete)
- ⬜ Authorization: check `budget.userId === req.user.id`

### 6.2 Frontend
- ⬜ Dashboard page with month selector (default: current month)
- ⬜ Budget widget showing: total spent, budget amount, remaining, usage % progress bar
- ⬜ Explicit "No budget set" state with a "Set budget" call to action
- ⬜ Set / edit budget inline form or modal
- ⬜ Loading state on the widget

---

## Phase 7 — WebSocket Budget Alerts

### 7.1 Backend
- ⬜ Install `@nestjs/websockets` and `socket.io` (or `ws`)
- ⬜ Create `AlertsGateway` with WebSocket namespace `/alerts`
- ⬜ Authenticate WS connections at handshake (session cookie or JWT)
- ⬜ On connection open: enqueue `evaluate-alerts` job via BullMQ, send any un-acked alerts
- ⬜ After transaction create / update / delete: enqueue `evaluate-alerts` job via BullMQ

### 7.2 BullMQ — Alert Queue
- ⬜ Create `AlertsQueue` (`@nestjs/bullmq`) with queue name `budget-alerts`
- ⬜ Create `AlertsProcessor` — worker that processes `evaluate-alerts` jobs:
  - ⬜ Load budget for current month (from Redis cache or DB)
  - ⬜ Calculate total spent for current month
  - ⬜ Check `budget_alert_triggers` — skip thresholds already fired this month
  - ⬜ For each new threshold crossed: insert into `budget_alert_triggers`, emit WS event to user
  - ⬜ If no budget set for current month — exit without alerts
- ⬜ Configure job options: `removeOnComplete: true`, `attempts: 3`, `backoff: exponential`
- ⬜ Handle client `subscribe` message — associate socket with user session
- ⬜ Handle client `ack` message — mark alert as acknowledged

### 7.3 Frontend
- ⬜ Initialize WebSocket connection after authentication
- ⬜ Send `subscribe` message on connect
- ⬜ Handle incoming budget alert events
- ⬜ Display alerts as toast notifications (or banner / notification panel)
- ⬜ Send `ack` on dismiss if implementing acknowledgement

---

## Phase 8 — UI Polish

- ⬜ Navigation bar with: logo, links (Dashboard, Transactions, Categories), user avatar, logout
- ⬜ Consistent spacing and typography across all screens
- ⬜ Hover and focus states on all interactive elements
- ⬜ Responsive layout: transactions table → cards on narrow screens
- ⬜ Light theme — verify consistent across all pages
- ⬜ 404 page (`not-found.tsx`)
- ⬜ Global error boundary (`error.tsx` and `global-error.tsx`)

---

## Phase 9 — Tests

### 9.1 Backend (Jest)
- ⬜ Set up test database (separate DB or in-memory mock)
- ⬜ Mock BullMQ queues in tests (replace with inline synchronous execution via `@nestjs/bullmq` test utils)
- ⬜ Mock Redis cache in tests (in-memory store or `jest.mock`)
- ⬜ Test 1: SSO login success path — mock provider response, verify user record created in DB
- ⬜ Test 2: Create category — happy path + duplicate name returns error
- ⬜ Test 3: Create transaction — happy path + validation errors
- ⬜ Test 4: Authorization — user A cannot GET/PATCH/DELETE user B's categories, transactions, budgets
- ⬜ Test 5: WebSocket alert at 50% — add transactions to hit 50%, verify alert sent once
- ⬜ Test 6: WebSocket alert at 80% — same pattern
- ⬜ Test 7: WebSocket alert at 100% — same pattern
- ⬜ Verify no real Google / GitHub network calls in any test

### 9.2 Frontend (React Testing Library) — optional but recommended
- ⬜ Login page renders both OAuth buttons
- ⬜ Transaction form validates and shows errors
- ⬜ Empty states render correctly

---

## Phase 10 — README & Docs

- ⬜ Document how to run backend locally
- ⬜ Document how to run frontend locally
- ⬜ Document how to run tests
- ⬜ Write short API reference (endpoints, request/response shapes)
- ⬜ Document category deletion behavior choice + rationale
- ⬜ Document Google OAuth setup (credentials, redirect URIs)
- ⬜ Document GitHub OAuth setup (credentials, callback URL)
- ⬜ Document WebSocket message format and budget alert rules
- ⬜ List all required environment variables with descriptions

---

## Phase 11 — Docker (Optional)

- ⬜ `Dockerfile` for backend
- ⬜ `Dockerfile` for frontend
- ⬜ `docker-compose.yml` — backend + frontend + PostgreSQL
- ⬜ Verify full stack starts with `docker compose up`
- ⬜ Document Docker setup in README
