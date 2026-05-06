# Personal Expense Tracker

A full-stack web application for tracking personal expenses. Users manage transactions by category, set monthly budgets, and receive real-time WebSocket alerts when spending crosses threshold values (50%, 80%, 100%).

## Two ways to run

| Option | When to use |
| ------ | ----------- |
| [Running Locally](#running-locally) | Active development — hot reload, easy debugging |
| [Docker Compose (full stack)](#running-with-docker-compose-full-stack) | Quick demo or production-like environment |

---

## Tech Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL
- **Auth:** Google OAuth 2.0 + GitHub OAuth (via Passport.js)
- **Real-time:** WebSocket

---

## Running Locally

### Prerequisites

- Node.js 20+
- [Colima](https://github.com/abiosoft/colima) — lightweight Docker runtime for macOS
- Docker CLI (`brew install docker`)

---

### Step 1 — Start Colima and infrastructure

Colima runs the PostgreSQL and Redis containers. Start it once per machine session:

```bash
colima start --memory 2
```

Then bring up PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Verify both are up:

```bash
nc -zv localhost 5432   # PostgreSQL
nc -zv localhost 6379   # Redis
```

Both should print `succeeded`.

---

### Step 2 — Configure environment variables

```bash
cd backend
cp .env.example .env
# open .env and fill in the values (see Environment Variables section below)

cd ../frontend
cp .env.local.example .env.local
```

---

### Step 3 — Start the backend

```bash
cd backend
npm install        # first time only
npx prisma migrate deploy   # apply DB migrations (first time only)
npm run start:dev
```

Backend runs on `http://localhost:3001` (or the port set in `.env`).

---

### Step 4 — Start the frontend

```bash
cd frontend
npm install        # first time only
NODE_OPTIONS="--max-old-space-size=512" npm run dev
```

Frontend runs on `http://localhost:3000` (Next.js default).

> `NODE_OPTIONS="--max-old-space-size=512"` limits Node.js heap to 512 MB during
> development to prevent memory pressure on machines with limited RAM.

---

### Stopping everything

```bash
docker compose down    # stop PostgreSQL and Redis
colima stop           # stop the VM (frees ~2 GB RAM)
```

---

## Running with Docker Compose (full stack)

This option runs the entire stack — PostgreSQL, Redis, backend, and frontend — in containers.

### Prerequisites

- Docker (or Colima + Docker CLI on macOS)
- A `.env` file in the project root with OAuth credentials and session secret (see [Environment Variables](#environment-variables))

### Step 1 — Create root `.env`

Create a `.env` file in the project root (next to `docker-compose.yml`) with the OAuth secrets:

```env
SESSION_SECRET=your_random_32_char_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 2 — Build and start

```bash
docker compose up --build
```

This will:
1. Build the backend image (compiles TypeScript, installs production deps)
2. Build the frontend image (runs `next build` with `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`)
3. Start PostgreSQL and Redis
4. Run Prisma migrations automatically before the backend starts
5. Serve the frontend on **http://localhost:3000** and the backend API on **http://localhost:3001**

### Step 3 — Stop

```bash
docker compose down          # stop containers, keep volumes
docker compose down -v       # stop and delete all data volumes
```

> **OAuth redirect URIs for Docker:** Use the same `http://localhost:3001/auth/google/callback` and `http://localhost:3001/auth/github/callback` URIs as for local development — the backend is still exposed on port 3001.

---

### Running tests

```bash
cd backend
npm run test
```

---

## Environment Variables

All required variables are listed in `backend/.env.example`.

| Variable               | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                   |
| `REDIS_HOST`           | Redis host (default: `localhost`)              |
| `REDIS_PORT`           | Redis port (default: `6379`)                   |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                     |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID                         |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret                     |
| `SESSION_SECRET`       | Random secret for session signing              |
| `FRONTEND_URL`         | Frontend origin (e.g. `http://localhost:3000`) |

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select existing)
3. **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
4. Application type: **Web application**
5. Add to **Authorized redirect URIs**:
   ```
   http://localhost:3001/auth/google/callback
   ```
6. Copy **Client ID** and **Client Secret** into `backend/.env`

## GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. **New OAuth App**
3. Set **Authorization callback URL**:
   ```
   http://localhost:3001/auth/github/callback
   ```
4. Copy **Client ID** and **Client Secret** into `backend/.env`

---

---

## Category Deletion Behavior

This project uses the **Block** strategy: a category cannot be deleted if it has transactions. The API returns `409 Conflict` with the number of linked transactions in the error message.

**Rationale:** prevents accidental data loss. The user must explicitly reassign or delete the transactions first.

---

## API Reference

All endpoints (except `/auth/*`) require an authenticated session cookie.

### Auth

| Method | Path                    | Description                 |
| ------ | ----------------------- | --------------------------- |
| `GET`  | `/auth/google`          | Redirect to Google OAuth    |
| `GET`  | `/auth/google/callback` | Google OAuth callback       |
| `GET`  | `/auth/github`          | Redirect to GitHub OAuth    |
| `GET`  | `/auth/github/callback` | GitHub OAuth callback       |
| `GET`  | `/auth/me`              | Return current user profile |
| `POST` | `/auth/logout`          | Destroy session             |

### Categories

| Method   | Path              | Description                                       |
| -------- | ----------------- | ------------------------------------------------- |
| `GET`    | `/categories`     | List all categories for current user              |
| `POST`   | `/categories`     | Create a category                                 |
| `PATCH`  | `/categories/:id` | Rename a category                                 |
| `DELETE` | `/categories/:id` | Delete a category (blocked if transactions exist) |

**POST / PATCH body:**

```json
{ "name": "Food" }
```

### Transactions

| Method   | Path                | Description                          |
| -------- | ------------------- | ------------------------------------ |
| `GET`    | `/transactions`     | List transactions (supports filters) |
| `POST`   | `/transactions`     | Create a transaction                 |
| `PATCH`  | `/transactions/:id` | Update a transaction                 |
| `DELETE` | `/transactions/:id` | Delete a transaction                 |

**GET query parameters:**

| Parameter    | Type                         | Description                                           |
| ------------ | ---------------------------- | ----------------------------------------------------- |
| `search`     | string                       | Search in title and notes (partial, case-insensitive) |
| `categoryId` | string                       | Filter by category ID                                 |
| `preset`     | `this_month` \| `last_month` | Date range preset                                     |
| `dateFrom`   | ISO date string              | Start of custom date range                            |
| `dateTo`     | ISO date string              | End of custom date range                              |
| `amountMin`  | number                       | Minimum amount                                        |
| `amountMax`  | number                       | Maximum amount                                        |

**POST / PATCH body:**

```json
{
  "title": "Coffee",
  "amount": 4.5,
  "currency": "USD",
  "date": "2025-05-06",
  "categoryId": "<uuid>",
  "notes": "optional"
}
```

### Budgets

| Method | Path                    | Description                      |
| ------ | ----------------------- | -------------------------------- |
| `PUT`  | `/budgets/:year/:month` | Set or update budget for a month |
| `GET`  | `/budgets/:year/:month` | Get budget and spending metrics  |

**PUT body:**

```json
{ "amount": 1500.0 }
```

**GET response (budget set):**

```json
{
  "budgetSet": true,
  "amount": 1500.0,
  "spent": 640.0,
  "remaining": 860.0,
  "usagePercent": 42.67
}
```

**GET response (no budget):**

```json
{ "budgetSet": false }
```

---

## WebSocket — Budget Alerts

**Namespace:** `/alerts`  
**Transport:** Socket.IO (over the same port as the backend)  
**Auth:** session cookie (sent automatically by the browser)

### Client → Server messages

#### `subscribe`

Send immediately after connecting. Triggers evaluation of budget alerts for the current month.

```json
// no payload required
socket.emit("subscribe")
```

#### `ack`

Acknowledge receipt of an alert. Prevents the alert from being re-sent on reconnect.

```json
socket.emit("ack", { "threshold": 80 })
```

`threshold` must be one of: `50`, `80`, `100`.

### Server → Client messages

#### `budget-alert`

Emitted when spending for the current calendar month crosses a threshold.

```json
{ "threshold": 80 }
```

**Alert rules:**

- Thresholds: **50%**, **80%**, **100%** of the monthly budget
- Each threshold fires **at most once per month** — firing state is persisted in the database
- If spending drops below a threshold and rises again, the alert is **not** re-sent
- Alerts are evaluated on WS connection + after any transaction create/update/delete
- No alerts if no budget is set for the current month
