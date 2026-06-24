-- Double-entry transfers; each row debits the source and credits the destination by the same amount.
create table transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations(id) on delete restrict,
  source_account_id uuid not null references accounts(id) on delete restrict,
  destination_account_id uuid not null references accounts(id) on delete restrict,
  amount bigint not null check (amount > 0),
  status text not null check (status in ('pending', 'posted', 'voided')),
  idempotency_key text,
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  voided_at timestamptz,
  check (source_account_id <> destination_account_id)
);

create index transfers_source_idx on transfers (tenant_id, source_account_id, created_at desc);
create index transfers_destination_idx on transfers (tenant_id, destination_account_id, created_at desc);
create index transfers_tenant_created_idx on transfers (tenant_id, created_at desc);
create index transfers_pending_idx on transfers (tenant_id, created_at) where status = 'pending';
