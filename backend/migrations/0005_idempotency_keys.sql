-- Stores the first response for each (key, tenant) so retried mutations replay instead of re-executing.
create table idempotency_keys (
  key text not null,
  tenant_id uuid not null references organizations(id) on delete restrict,
  response_body jsonb,
  status_code int,
  created_at timestamptz not null default now(),
  primary key (key, tenant_id)
);
