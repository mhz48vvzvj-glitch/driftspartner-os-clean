-- Driftspartner OS - Dokumentarkiv V1
-- Kjor denne i Supabase SQL Editor for solid dokumentarkiv med bygg/sak-kobling og versjoner.

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  address text,
  building_type text,
  built_year integer,
  gross_area numeric,
  technical_summary text,
  created_at timestamptz not null default now()
);

alter table documents add column if not exists building_id uuid references buildings(id) on delete set null;
alter table documents add column if not exists deviation_id uuid references deviations(id) on delete set null;
alter table documents add column if not exists work_order_id uuid references work_orders(id) on delete set null;
alter table documents add column if not exists version integer not null default 1;
alter table documents add column if not exists expires_at date;
alter table documents add column if not exists notes text;

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  mime_type text,
  file_name text,
  notes text,
  created_at timestamptz not null default now()
);

alter table buildings enable row level security;
alter table document_versions enable row level security;

drop policy if exists buildings_select_property_access on buildings;
create policy buildings_select_property_access
on buildings for select
to authenticated
using (has_property_access(property_id));

drop policy if exists buildings_write_property_access on buildings;
create policy buildings_write_property_access
on buildings for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));

drop policy if exists document_versions_select_property_access on document_versions;
create policy document_versions_select_property_access
on document_versions for select
to authenticated
using (has_property_access(property_id));

drop policy if exists document_versions_write_property_access on document_versions;
create policy document_versions_write_property_access
on document_versions for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
