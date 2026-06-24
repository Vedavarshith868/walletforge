# WalletForge — Interview Prep

Likely questions about the design, with answers tight enough to say out loud. Skim the ones that map to whatever the interviewer is poking at; the architecture rationale also lives in the README's "Design decisions" section.

---

### 1. What is WalletForge in one sentence?

A multi-tenant double-entry payment ledger: many organizations each keep their own accounts and transfers, where every transfer is an atomic balanced posting, asset balances can't go negative, mutations are idempotent, and tenant isolation is enforced by the database.

### 2. What does ACID mean, and where do you rely on each property?

Atomicity, Consistency, Isolation, Durability. A transfer relies on **atomicity** — debiting the source, crediting the destination, and inserting the transfer row all commit together or not at all. **Consistency** is the double-entry invariant plus the asset-non-negative check. **Isolation** is `SERIALIZABLE`, which keeps concurrent transfers from corrupting balances, and **durability** is Postgres's write-ahead log guaranteeing a committed transfer survives a crash.

### 3. What is SERIALIZABLE isolation and what specific anomaly does it prevent here?

`SERIALIZABLE` guarantees that concurrent transactions produce a result equivalent to running them one after another in some order. The anomaly it prevents is a lost update / write skew on balances: two simultaneous withdrawals from a $100 account that both read the balance, both pass the "enough funds" check, and both commit, leaving −$20. Under `SERIALIZABLE`, Postgres's predicate-locking (SSI) detects the read-write conflict and aborts one transaction with error `40001`, which my retry loop re-runs against the now-updated balance so the second withdrawal correctly fails.

### 4. Why retry on 40001 instead of locking rows up front?

`SERIALIZABLE` is optimistic: it doesn't block, it aborts the loser of a conflict with a serialization failure, and the contract is that you retry. That keeps the common, uncontended path lock-free and fast, and only pays a cost under actual contention. I bound it to three retries with small jittered backoff so a genuine hot row degrades gracefully instead of retrying forever or thundering.

### 5. How does idempotency work mechanically?

Every mutating POST can carry an `Idempotency-Key`. The middleware does `INSERT INTO idempotency_keys (key, tenant_id) ... ON CONFLICT DO NOTHING`; if it inserted the row (`rowCount === 1`) this is the first execution, so it runs the handler and then stores the response status and body on that row. If the insert conflicted, it reads the stored response and replays it verbatim. So the same key produces the same response and the side effect happens exactly once.

### 6. What race does the `ON CONFLICT` close, and what about two truly simultaneous duplicates?

The unique constraint on `(key, tenant_id)` is the serialization point: only one concurrent insert can win, so only one request ever executes the side effect. If a second request with the same key arrives while the first is still in flight, it sees the claimed row with no stored response yet and gets a `409 in progress` rather than double-processing; once the first finishes, retries replay the stored response. The honest limitation is that the idempotency row and the side effect commit in separate transactions, so a crash in between can leave a key "stuck" — at scale I'd fold the idempotency write into the transfer's own transaction.

### 7. What is Row-Level Security and why did you `FORCE` it?

RLS lets Postgres attach a policy to a table so every query is automatically filtered by a predicate — here, `tenant_id = current_setting('app.tenant_id')`. I `FORCE ROW LEVEL SECURITY` because, by default, the table owner bypasses RLS, and on Render the app connects as the owner; without `FORCE`, the policies would be silently inert and isolation would be a lie. With it, even a missing application filter or a SQL-injection bug cannot read another tenant's rows.

### 8. How is the tenant context set per request without leaking across a connection pool?

After verifying the JWT, the auth middleware checks a connection out of the pool and runs `set_config('app.tenant_id', <tenant>, false)` so the RLS policies resolve to that tenant for every query on that connection. The request holds that one connection for its lifetime, and on response I `RESET app.tenant_id` before returning it to the pool. Auth bootstrap queries and the sweeper instead set the value transaction-locally, so it auto-clears at commit.

### 9. Why is the `organizations` table not under RLS?

`organizations` is the tenant registry — it *defines* the tenants rather than holding tenant-scoped data. Putting RLS on it would create a bootstrap deadlock: signup and login have to look an org up by slug *before* any tenant context exists. Every table that holds tenant data (`users`, `accounts`, `transfers`, `idempotency_keys`, `audit_log`) is locked down; the registry is the one deliberate, explained exception, and no endpoint ever lists organizations across tenants.

### 10. What is the double-entry invariant and how do you guarantee it?

Every transfer moves one amount: it debits the source and credits the destination by the same value, so the books always balance. Because all accounts start at zero and every transfer conserves the total, the sum of all account balances in a tenant is always zero — that's the invariant my tests assert. It's guaranteed by doing both balance updates and the transfer insert inside one transaction, so they're all-or-nothing.

### 11. How can asset accounts never go negative, even under concurrency?

Before debiting, the engine checks that the source's available balance covers the amount, and it does this inside the `SERIALIZABLE` transaction. Single-statement balance math (`balance = balance - $1`) plus serializable isolation means two concurrent debits can't both pass the check — one is aborted and retried, and on retry it sees the lowered balance and is rejected. Liability accounts are intentionally allowed to go negative, which is how money first enters the ledger.

### 12. Walk through the two-phase transfer state machine.

A transfer is `pending`, `posted`, or `voided`. A two-phase transfer is created `pending` — it reserves the source's balance but moves no money — and then either `post` moves the balances and stamps `posted_at`, or `void` releases the reservation and stamps `voided_at`. The transitions are guarded: posting or voiding anything not currently `pending` returns `409`, so a transfer is captured or cancelled exactly once. This is the same authorize-then-capture pattern card networks use.

### 13. What is "available balance" and why reserve instead of just debiting?

Available balance is `posted_balance − Σ(pending outgoing transfers)`. Reserving means a pending transfer lowers what you can spend without yet moving money, which guarantees a pending transfer can always be posted later without overdrawing the account. An immediate transfer also checks against available (not just posted) balance, so it can't spend money already promised to a pending one.

### 14. Explain your indexing choices.

The two composite indexes `(tenant_id, source_account_id, created_at DESC)` and `(tenant_id, destination_account_id, created_at DESC)` serve account history and the per-source pending-sum query, leading with `tenant_id` because every query is tenant-scoped. `(tenant_id, created_at DESC)` backs the general transfers listing. There's a partial index on pending transfers for the sweeper, and the unique index on `(key, tenant_id)` both enforces and accelerates idempotency.

### 15. Why a *partial* index for pending transfers?

Pending is a small, transient subset of all transfers, but it's what the sweeper scans constantly looking for expired ones. A partial index `WHERE status = 'pending'` only indexes those rows, so it stays tiny and cache-friendly and doesn't carry the millions of `posted` rows that would never match. It's the right tool whenever you repeatedly query a small, well-defined slice of a big table.

### 16. What's inside the JWT, how is it verified, and what are the risks?

The token is a base64url header and payload plus an HMAC-SHA256 signature over them, keyed by `JWT_SECRET`. The payload carries the user id (`sub`), the tenant id, and email; the server recomputes the signature to verify integrity and checks `exp`, so it trusts the claims without a session lookup. The main risks are secret leakage (mitigated by a strong server-side secret) and no server-side revocation before expiry, which I'd address with short lifetimes plus refresh tokens or a denylist.

### 17. Why Postgres over MongoDB here?

A ledger is the textbook case for a relational engine: it needs multi-row ACID transactions, foreign keys, and strong isolation, and it benefits directly from `SERIALIZABLE`, row-level security, and partial indexes. Mongo's per-document atomicity would push the cross-account transfer logic and isolation guarantees up into my application code. The data is also rigidly relational — accounts, transfers, tenants — with no schema flexibility worth trading correctness for.

### 18. How does the sweeper work, and why iterate tenants?

A `setInterval` loop in the API process periodically finds pending transfers older than 24 hours and voids them. Because RLS scopes every query to one tenant, the sweeper reads the org registry and runs the void inside each tenant's RLS context, so even the background job can't cross tenant boundaries and I don't need a privileged bypass role. Voiding only flips status and releases the reservation, so it never touches balances.

### 19. How would you scale this to many tenants and high volume?

Shard by `tenant_id` (the natural partition key), with big tenants on dedicated databases and the long tail hash-sharded behind a routing layer. Serve read-heavy endpoints — dashboards, history, listings — from read replicas, keeping the primary for transfer writes, and front everything with a connection pooler like PgBouncer. Pull the sweeper into its own scheduled worker with a leader lock, and move audit writes off the critical path through a transactional outbox.

### 20. Why raw SQL instead of an ORM, and what would you change with more time?

The correctness of a ledger lives in the exact SQL — isolation levels, `ON CONFLICT`, partial indexes, RLS, the pending-reservation `SUM` — so I wanted that explicit and under my control rather than behind a query builder. With more time I'd make idempotency crash-safe by writing its record in the same transaction as the side effect, switch deep listings to keyset pagination, add refresh-token rotation, and split the sweeper into a dedicated worker once the API runs multiple instances.
