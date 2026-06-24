-- Organizations are the tenant registry; this table defines tenants and is not itself tenant-scoped.
create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);
