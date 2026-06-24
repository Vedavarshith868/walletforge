-- Tenant isolation enforced in the database: every tenant-scoped table filters on app.tenant_id.
alter table users enable row level security;
alter table users force row level security;
create policy tenant_isolation on users
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

alter table accounts enable row level security;
alter table accounts force row level security;
create policy tenant_isolation on accounts
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

alter table transfers enable row level security;
alter table transfers force row level security;
create policy tenant_isolation on transfers
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

alter table idempotency_keys enable row level security;
alter table idempotency_keys force row level security;
create policy tenant_isolation on idempotency_keys
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

alter table audit_log enable row level security;
alter table audit_log force row level security;
create policy audit_select on audit_log for select
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy audit_insert on audit_log for insert
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);
