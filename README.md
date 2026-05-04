# Personal Expense Tracker

A full-stack web application for tracking personal expenses. Users manage transactions by category, set monthly budgets, and receive real-time WebSocket alerts when spending crosses threshold values (50%, 80%, 100%).

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
docker compose up -d
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
```

---

### Step 3 — Start the backend

```bash
cd backend
npm install        # first time only
npm run start:dev
```

Backend runs on `http://localhost:3000` (or the port set in `.env`).

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

### Running tests

```bash
cd backend
npm run test
```

---

## Environment Variables

All required variables are listed in `backend/.env.example`.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis host (default: `localhost`) |
| `REDIS_PORT` | Redis port (default: `6379`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `SESSION_SECRET` | Random secret for session signing |
| `FRONTEND_URL` | Frontend origin (e.g. `http://localhost:3001`) |

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

_Full API documentation and WebSocket reference will be added in Phase 10._
