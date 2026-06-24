-- Users belong to exactly one organization and authenticate within that tenant.
create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations(id) on delete restrict,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);
