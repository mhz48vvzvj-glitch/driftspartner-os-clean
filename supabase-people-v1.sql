-- Driftspartner OS - Beboere og styre V1
-- Kjor hele filen i Supabase SQL Editor. Trygg a kjore flere ganger.

create table if not exists property_contacts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  role text,
  contact_role text,
  contact_type text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table property_contacts add column if not exists name text;
alter table property_contacts add column if not exists role text;
alter table property_contacts add column if not exists contact_role text;
alter table property_contacts add column if not exists contact_type text;
alter table property_contacts add column if not exists email text;
alter table property_contacts add column if not exists phone text;
alter table property_contacts add column if not exists notes text;
alter table property_contacts add column if not exists updated_at timestamptz not null default now();

update property_contacts
set role = coalesce(role, contact_role, 'Kontakt')
where role is null;

update property_contacts
set contact_role = coalesce(contact_role, role, contact_type, 'Kontakt')
where contact_role is null;

update property_contacts
set contact_type = coalesce(contact_type, role, contact_role, 'Kontakt')
where contact_type is null;

update property_contacts
set name = coalesce(nullif(name, ''), email, phone, 'Kontakt')
where name is null or name = '';

alter table property_contacts alter column name set not null;

alter table property_contacts enable row level security;

drop policy if exists property_contacts_select_property_access on property_contacts;
create policy property_contacts_select_property_access
on property_contacts for select
to authenticated
using (has_property_access(property_id));

drop policy if exists property_contacts_write_property_access on property_contacts;
create policy property_contacts_write_property_access
on property_contacts for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
