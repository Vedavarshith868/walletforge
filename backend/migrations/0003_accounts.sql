-- Wallets owned by a tenant; balance is stored as an integer count of minor units.
create table accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations(id) on delete restrict,
  name text not null,
  type text not null check (type in ('asset', 'liability')),
  balance bigint not null default 0,
  created_at timestamptz not null default now()
);

create index accounts_tenant_created_idx on accounts (tenant_id, created_at desc);
