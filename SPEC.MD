# Personal Expense Tracker — Specification

## Overview

A full-stack web application for tracking personal expenses. Users manage transactions by category, control a monthly budget, and receive real-time alerts when spending crosses threshold values.

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
| Real-time | WebSocket (via `@nestjs/websockets`) |
| Authentication | Passport.js (Google OAuth 2.0 + GitHub OAuth) |
| Testing | Jest (backend), React Testing Library (frontend) |

---

## 1. Architecture and General Rules

- The application supports multiple users
- Each user sees **only their own data**
- No sharing of any kind: no invites, no public links, no shared budgets
- The application must run locally following the README instructions
- All API endpoints (except `/auth/*`) require authentication
- Authorization is enforced per request — a user cannot access another user's resources even if they know the resource ID

---

## 2. Functional Requirements

### 2.1 Authentication (SSO Only)

Registration and sign-in are done **exclusively via OAuth providers** — no username/password forms.

**Supported providers:**
- Google OAuth 2.0 / OpenID Connect
- GitHub OAuth

**First sign-in behavior:**
- The backend automatically creates a local user record in the database
- Account linking between Google and GitHub is **not required** — if the same person signs in with both providers, these are treated as separate accounts

**Fields stored in the `users` table:**

```
provider          — "google" | "github"
provider_user_id  — user ID from the provider (not email!)
email             — nullable, provider may not return it
display_name      — name shown in the UI
avatar_url        — nullable
created_at
updated_at
```

> User identity = `provider` + `provider_user_id`. Email is unreliable — GitHub may not return it.

**Session:**
- Session persists across page refreshes (cookie-based session or JWT)
- Logout is implemented

---

### 2.2 Categories

A category is a label the user uses to group expenses (e.g. "Food", "Transport", "Entertainment").

**CRUD operations:**
- Create a category
- Rename a category
- Delete a category

**Rules:**
- Category name must be unique per user
- Attempting to create a duplicate returns a clear error message

**Deleting a category that has transactions:**

Choose **one** approach and document it in README:

| Approach | Description |
|----------|-------------|
| **Block** | Deletion is not allowed if transactions exist in the category. Show an error with the transaction count |
| **Reassign** | Transactions are automatically moved to the `Uncategorized` category (created automatically when the user registers) |

---

### 2.3 Transactions (Expenses)

A transaction belongs to exactly one user.

**Transaction fields:**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `title` | string | ✅ | Short description (e.g. "Coffee at Starbucks") |
| `amount` | decimal | ✅ | Amount > 0 |
| `currency` | string | ✅ | Currency code (e.g. `USD`). Single currency is acceptable for MVP but must be explicit in the UI |
| `date` | date | ✅ | Transaction date |
| `category_id` | FK | ✅ | Reference to one of the user's categories |
| `notes` | text | ❌ | Optional free-text notes |

**CRUD operations:**
- Create a transaction
- Edit any transaction field
- Delete a transaction

**Validation rules:**
- `amount` must be greater than 0
- `date` must be a valid date
- `title` must be non-empty
- `category_id` must belong to the current user

---

### 2.4 Monthly Budget

**Setup:**
- A user sets a budget amount for a specific month (year + month)
- The budget can be updated for an already-existing month

**Calculated metrics for the selected month:**

| Metric | Formula |
|--------|---------|
| Total spent | Sum of all transactions for the month |
| Remaining | Budget − Total spent |
| Usage % | (Total spent / Budget) × 100 |

**Important:** If no budget is set for the selected month, the UI must show an explicit **"No budget set"** state — no misleading zeros or percentages.

---

### 2.5 Search and Filtering

**Search:**
- By `title` and `notes` fields (case-insensitive, partial match)

**Filters:**
- By category (one or more)
- By date range:
  - This month
  - Last month
  - Custom range (date from / date to)
- By amount range (min / max)

Filters can be combined. Results update when any filter changes.

---

### 2.6 Real-Time Notifications via WebSocket

#### Server → Client: Budget Alerts

The backend pushes notifications to the client when spending for the **current calendar month** crosses threshold values.

**Thresholds:**
- 50% of budget
- 80% of budget
- 100% of budget

**"Once per month" rule:**
- Each threshold fires at most once per month
- If a user deletes a transaction and spending drops below a threshold, then rises again — the alert is **not** re-sent
- The state of fired thresholds is persisted in the database (e.g. `budget_alert_triggers` table)

**When alerts are evaluated:**
1. When a WebSocket connection is opened (send all already-fired but unacknowledged alerts)
2. After a transaction is created, edited, or deleted

**If no budget is set for the current month — no alerts are generated.**

#### Client → Server: Client Messages

The client must send at least one meaningful message to the server. Acceptable options:

| Type | Description |
|------|-------------|
| `subscribe` | Subscribe to alerts for a specific user/month |
| `ack` | Acknowledge receipt of an alert (removes it from the re-delivery queue) |

The chosen type, payload structure, and server behavior must be **documented in README**.

#### UI for Alerts

Alerts must be visible to the user. Acceptable presentation options:
- Toast notifications
- Alert banner at the top of the page
- Notification panel (bell icon)

---

## 3. UI/UX Requirements

### Screens and Components

**1. Login page (`/login` or `/`)**
- "Continue with Google" button
- "Continue with GitHub" button
- No other authentication forms

**2. Dashboard (main page)**
For the selected month displays:
- Total spent
- Budget amount
- Remaining budget
- Usage percentage (progress bar or widget)
- "No budget set" state when no budget is configured
- Ability to set or update the budget

**3. Transactions screen**
- List or table of transactions
- Search input
- Filter controls (category, date range, amount range)
- "Add transaction" button
- Edit and delete actions per row
- Modal / drawer / separate page for create/edit

**4. Categories management**
- List of user's categories
- Create / rename / delete
- Accessible via a separate page or modal

**5. Real-time alerts**
- Visible while the WebSocket connection is active

### Required UI Details

- Consistent spacing and typography across all major screens
- Visible hover and focus states for interactive elements
- Explicit **empty states** for:
  - No transactions
  - No categories
  - No search results
  - No budget set
- At least one visible **loading state** on a main screen or major data block
- Client-side form validation with clear error messages
- Light theme only (dark mode is not required)
- Responsive layout for narrow screens: table → cards or horizontal scroll

---

## 4. Backend Requirements (NestJS)

### API Structure

- REST API covers all UI flows
- All protected endpoints use a Guard for authentication verification
- Authorization is checked per resource (a user cannot access another user's transaction even knowing its ID)
- Input validation via `class-validator` + `class-transformer`
- Errors are returned in a consistent format with clear messages

### Authentication

- Passport.js strategies: `passport-google-oauth20` and `passport-github2`
- After successful OAuth — find or create the user record in the database
- Session via `express-session` + `connect-pg-simple` (or JWT)
- WebSocket connections are also authenticated (session or JWT at handshake)

### Database Schema (PostgreSQL)

**Core tables:**

```sql
users
  id, provider, provider_user_id, email, display_name, avatar_url, created_at, updated_at

categories
  id, user_id (FK), name, created_at, updated_at
  UNIQUE (user_id, name)

transactions
  id, user_id (FK), category_id (FK), title, amount, currency, date, notes, created_at, updated_at

monthly_budgets
  id, user_id (FK), year, month, amount, created_at, updated_at
  UNIQUE (user_id, year, month)

budget_alert_triggers
  id, user_id (FK), year, month, threshold (50|80|100), triggered_at
  UNIQUE (user_id, year, month, threshold)
```

### Environment Variables

Documented in README. Minimum required:

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

## 5. Testing Requirements

**Minimum test coverage (Jest):**

| # | What to test |
|---|-------------|
| 1 | SSO login success path — using a mock/stub provider, no real HTTP calls to Google/GitHub |
| 2 | Create category |
| 3 | Create transaction |
| 4 | Authorization: user cannot access another user's categories / transactions / budgets |
| 5 | WebSocket budget alert at 50% |
| 6 | WebSocket budget alert at 80% |
| 7 | WebSocket budget alert at 100% |

**Rules:**
- Tests must not depend on real Google / GitHub network calls
- Tests must run locally without additional infrastructure (use a test database or mocks)

---

## 6. Deliverables

- GitLab repository with frontend and backend source code
- `README.md` containing:
  - How to run backend and frontend locally
  - How to run tests
  - Short description of the API
  - Chosen category deletion behavior (block vs. reassign) with explanation
  - How to configure Google OAuth credentials
  - How to configure GitHub OAuth credentials
  - WebSocket message format and budget alert rules

---

## 7. Optional Deliverable

- `Dockerfile` and/or `docker-compose.yml` for running the full stack with a single command
- If Docker is not implemented due to machine restrictions — this must be noted in README

---

## 8. Acceptance Checklist

- [ ] User can sign in with Google
- [ ] User can sign in with GitHub
- [ ] A local user record is created automatically on first SSO sign-in
- [ ] User can create, rename, and delete categories
- [ ] User can create, edit, and delete transactions
- [ ] User can set a monthly budget and see total spent, remaining balance, and usage percentage
- [ ] User can search and filter transactions
- [ ] Data is isolated per user (no cross-account access)
- [ ] Connected client receives real-time alerts at 50%, 80%, and 100% for the current calendar month
- [ ] WebSocket flow includes at least one Client → Server message that affects server behavior
- [ ] Application runs locally following the README instructions
- [ ] All tests pass locally

---

## 9. Implementation Notes

1. **GitHub may not return email** — user identity is based on `provider` + `provider_user_id`, not email
2. **"Once per month" alert rule** — if a user deletes a transaction after crossing a threshold and adds a new one later, no duplicate alert is sent. Logic is enforced via the `budget_alert_triggers` table
3. **Currency** — a single currency (e.g. `USD`) is sufficient for MVP, but it must be explicitly displayed in the UI and stored on each transaction
4. **`Uncategorized` category** — if the "reassign" approach is chosen, this category is created automatically when the user registers and cannot be deleted
