# WalletForge

WalletForge is a multi-tenant, double-entry payment ledger service in the spirit of Stripe Ledger or the open-source Blnk. Independent organizations (tenants) each manage their own accounts and transfers behind strict correctness guarantees: every transfer is an atomic, balanced double-entry posting; asset accounts can never go negative; mutations are idempotent; and tenant isolation is enforced in the database with PostgreSQL Row-Level Security rather than trusted application code. It supports immediate transfers and a two-phase (pending → posted/voided) flow with automatic expiry, all over a small REST API and a React dashboard.

## Tech stack

- **Backend:** Node.js + Express, PostgreSQL accessed directly through `pg` (raw SQL, no ORM)
- **Auth:** JWT (`jsonwebtoken`) + `bcrypt`
- **Database:** PostgreSQL with Row-Level Security; numbered `.sql` migrations run in order (no migration framework)
- **Frontend:** React (Vite) + Tailwind CSS, `fetch` for HTTP
- **Deployment:** Render (Express + managed Postgres) and Vercel (frontend)

## Architecture

```
                        ┌──────────────────────────────┐
                        │      React SPA (Vercel)       │
                        │   Vite + Tailwind CSS         │
                        │   JWT stored in localStorage  │
                        └───────────────┬──────────────┘
                                        │ HTTPS via fetch
                                        │ Authorization: Bearer <JWT>
                                        │ Idempotency-Key: <uuid>
                                        ▼
                        ┌──────────────────────────────┐
                        │     Express API (Render)      │
                        │                               │
                        │  requireAuth  → verifies JWT, │
                        │     checks out a pg client,   │
                        │     SET app.tenant_id         │
                        │  idempotency middleware       │
                        │  routes: /auth /accounts      │
                        │          /transfers           │
                        │  transfer engine              │
                        │     SERIALIZABLE + retry      │
                        │  sweeper (setInterval)        │
                        └───────────────┬──────────────┘
                                        │ pg, one connection per request
                                        │ tenant context as a session GUC
                                        ▼
                        ┌──────────────────────────────┐
                        │      PostgreSQL (Render)      │
                        │  Row-Level Security (FORCE)   │
                        │  organizations  users         │
                        │  accounts       transfers     │
                        │  idempotency_keys  audit_log  │
                        └──────────────────────────────┘
```

The single Express process owns the API, the transfer engine, and the pending-transfer sweeper. Money is stored as `bigint` minor units (e.g. cents); the API speaks integer minor units, and the UI converts to and from major units for display.

## Project layout

```
backend/
  migrations/        numbered .sql files (schema, indexes, RLS)
  scripts/migrate.js runner that applies pending migrations in order
  src/
    db.js            pg pool + tenant-scoped connection helpers
    index.js         express app + route wiring + sweeper start
    middleware/      auth (JWT + RLS), idempotency, errors
    lib/             transfer engine, sweeper, validation, serializers
    routes/          auth, accounts, transfers
  tests/             supertest integration tests
frontend/
  src/
    lib/             api client, auth context, hooks, money helpers
    components/       layout + shared UI
    pages/           signup/login, dashboard, accounts, transfers
```

## Local setup

Prerequisites: Node 18+ (tested on 20 and 24). PostgreSQL is optional — `npm run dev:db` starts a real, throwaway Postgres locally with no install required.

### 1. Database

Either start the bundled local Postgres (recommended — no install, RLS enforced):

```bash
cd backend
npm install
npm run dev:db                # persistent Postgres on :55433, leave it running
```

`dev:db` provisions two connection strings and prints them:

- `postgres://walletforge:walletforge@localhost:55433/walletforge` — the **app role**, a non-superuser that owns the schema, so Row-Level Security is enforced (use this for the app).
- `postgres://postgres:postgres@localhost:55433/walletforge` — the **superuser**, which bypasses RLS so you can inspect every tenant's rows while debugging.

Or point `DATABASE_URL` at any PostgreSQL 14+ you already run.

### 2. Backend

```bash
cd backend
cp .env.example .env          # set DATABASE_URL (the app-role string above) and a JWT_SECRET
npm run migrate               # applies migrations 0001..0007 in order
npm run dev                   # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

### 4. Tests

The integration tests run against a real Postgres database (they truncate tables between tests, so point them at a throwaway database):

```bash
cd backend
DATABASE_URL=postgres://localhost:5432/walletforge_test npm test
```

## API walkthrough

Because every balance must come from a balanced transfer, money enters the ledger through a **liability** account (which may go negative); **asset** accounts can never go negative.

```bash
# Create an organization and its first user
curl -sX POST localhost:4000/auth/signup-org \
  -H 'content-type: application/json' \
  -d '{"organizationName":"Acme","slug":"acme","email":"owner@acme.test","password":"hunter2hunter2"}'
# → { "token": "...", "organization": {...}, "user": {...} }

TOKEN=...   # paste the token

# Create an asset account and a liability funding account
curl -sX POST localhost:4000/accounts -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"name":"Cash","type":"asset"}'
curl -sX POST localhost:4000/accounts -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"name":"External","type":"liability"}'

# Fund Cash by transferring from External (amount is in minor units: 100000 = 1000.00)
curl -sX POST localhost:4000/transfers -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -H 'Idempotency-Key: 7b9b0c2e-2b1a-4f0e-9b2a-1c2d3e4f5a6b' \
  -d '{"sourceAccountId":"<external-id>","destinationAccountId":"<cash-id>","amount":100000}'
```

### Endpoints

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/auth/signup-org` | create org + first user |
| POST | `/auth/signup` | join an existing org by slug |
| POST | `/auth/login` | returns a tenant-scoped JWT |
| POST | `/accounts` | create account (idempotent) |
| GET | `/accounts` | list accounts with balances |
| GET | `/accounts/:id` | account detail incl. available balance |
| GET | `/accounts/:id/history` | paginated transfer history |
| POST | `/transfers` | immediate transfer (idempotent) |
| POST | `/transfers/pending` | create a pending transfer (idempotent) |
| POST | `/transfers/:id/post` | post a pending transfer |
| POST | `/transfers/:id/void` | void a pending transfer |
| GET | `/transfers` | paginated, optional `?status=` filter |
| GET | `/transfers/:id` | transfer detail |

Every mutating `POST` accepts an `Idempotency-Key` header. Errors share one shape: `{ "error": { "code", "message" } }`.

## Deployment

### Backend + database on Render

The repository includes [`render.yaml`](render.yaml), a Render Blueprint that provisions a web service and a managed Postgres instance.

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and point it at the repo. Render reads `render.yaml`, creates `walletforge-db` and `walletforge-backend`, and wires `DATABASE_URL` automatically.
3. `JWT_SECRET` is generated by Render; `DATABASE_SSL` is set to `true`.
4. Migrations run automatically on every deploy: the service's start command is `npm run migrate && npm start`, which is idempotent (already-applied migrations are skipped) and works on the free plan.

To deploy manually instead of via blueprint: create a Postgres instance, then a Web Service with root directory `backend`, build command `npm install`, start command `npm start`, and the env vars listed in `render.yaml`.

### Frontend on Vercel

1. In Vercel, **Add New → Project** and import the repo.
2. Set the project **Root Directory** to `frontend` (Vercel auto-detects Vite).
3. Add an environment variable `VITE_API_URL` pointing at the Render backend URL.
4. Deploy. [`frontend/vercel.json`](frontend/vercel.json) rewrites all routes to `index.html` so client-side routing works on refresh.

## Design decisions

- **PostgreSQL over MongoDB.** A ledger is the canonical relational, strongly-consistent workload: it needs multi-row ACID transactions (debit one account, credit another, write the transfer, atomically), foreign keys, and isolation guarantees. Postgres gives me `SERIALIZABLE`, row-level security, and partial indexes out of the box; a document store would push correctness back into application code.

- **Row-Level Security for tenancy.** Tenant isolation lives in the database, not in hand-written `WHERE tenant_id = ?` clauses. After verifying the JWT, middleware sets a per-connection `app.tenant_id` setting, and `FORCE ROW LEVEL SECURITY` policies filter every row by it. A forgotten filter or an injection bug still cannot read across tenants. The app-layer scoping that exists is belt-and-suspenders.

- **`SERIALIZABLE` isolation with a bounded retry loop.** The transfer engine runs each posting at `SERIALIZABLE` and retries up to three times with jittered backoff on a `40001` serialization failure. This makes concurrent transfers against the same account provably correct — two simultaneous withdrawals can't both pass the balance check — without hand-rolling row locks, and the retry loop absorbs the optimistic-concurrency aborts that `SERIALIZABLE` raises.

- **Idempotency via `INSERT ... ON CONFLICT DO NOTHING`.** Each mutating request carries an `Idempotency-Key`. The first request inserts a row into `idempotency_keys` and processes; a duplicate hits the unique conflict, finds the stored status code and response body, and replays it byte-for-byte without re-executing. The unique index serializes concurrent duplicates, so a key is processed exactly once.

- **Raw SQL over an ORM.** Correctness here is about the exact SQL — isolation levels, `ON CONFLICT`, partial indexes, RLS, `SUM` of pending reservations. Writing it directly with `pg` keeps that visible and under my control instead of behind an ORM's query builder, and it's the version I can reason about in an interview.

- **JWT for auth.** The API is stateless: the token carries the user id and the tenant id, signed with HS256. There's no server-side session store to scale, and the tenant claim is exactly what middleware needs to set the RLS context on each request.

- **Two-phase transfers with reserved balance.** A pending transfer doesn't move money; it reserves it. Available balance is `posted_balance − Σ(pending outgoing)`, enforced at creation, so a pending transfer can always be posted later without overdrawing. Posting moves the balances and stamps `posted_at`; voiding releases the reservation. This is the authorize-then-capture pattern that real payment systems use.

- **Single-process sweeper.** Pending transfers auto-void after 24 hours via a `setInterval` loop in the same Node process. It iterates tenants and runs inside each tenant's RLS context, so even the background job respects isolation. One process is the right size for this scale; the section below covers when I'd pull it out.

## What I would change at scale

- **Shard by tenant.** `tenant_id` is the natural partition key. Large tenants could move to dedicated databases and the rest hash-shard, with a routing layer mapping tenant → shard.
- **Read replicas.** Dashboards, history, and listing endpoints are read-heavy and can be served from replicas, keeping the primary for transfer writes.
- **Move the sweeper into its own worker.** A separate scheduled worker (or a real job queue) decouples expiry sweeps from the API process, lets it scale independently, and avoids duplicated work when the API runs multiple instances — at which point I'd add a leader lock or hand it to the scheduler.
- **Asynchronous audit writes.** The audit log could be written through a transactional outbox and shipped to an append-only store asynchronously, taking it off the transfer's critical path.
- **Idempotency in the same transaction.** Today the idempotency record and the side effect commit separately; folding the record into the transfer's transaction (or an outbox) makes the "exactly once" guarantee crash-proof.
- **Cursor pagination.** Offset pagination is fine for a demo but degrades on deep pages; keyset pagination on `(created_at, id)` scales with the composite indexes already in place.
- **Connection pooling at the edge.** A pooler such as PgBouncer in transaction mode would let many API instances share a bounded set of Postgres connections.

## License

MIT — built as a portfolio project.
