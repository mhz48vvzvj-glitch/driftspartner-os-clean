-- Driftspartner OS - Onboarding V1
-- Kjor denne i Supabase SQL Editor for FDV-mapper i ny-kunde-flyten.

create table if not exists document_folders (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  parent_id uuid references document_folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table document_folders enable row level security;

drop policy if exists document_folders_select_property_access on document_folders;
create policy document_folders_select_property_access
on document_folders for select
to authenticated
using (has_property_access(property_id));

drop policy if exists document_folders_write_property_access on document_folders;
create policy document_folders_write_property_access
on document_folders for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));

alter table customers add column if not exists org_no text;
alter table customers add column if not exists subscription_plan text;
alter table customers add column if not exists subscription_first_year_amount numeric not null default 0;
alter table customers add column if not exists subscription_year_two_amount numeric not null default 0;
alter table customers add column if not exists subscription_billing_period text not null default 'yearly';
alter table customers add column if not exists subscription_status text not null default 'pending';
alter table customers add column if not exists subscription_started_at date;
