-- Append-only audit trail; row-level security below grants insert and select but never update or delete.
create table audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references organizations(id) on delete restrict,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_tenant_created_idx on audit_log (tenant_id, created_at desc);
