-- Driftspartner OS - Arshjul V1
-- Kjor denne i Supabase SQL Editor for arshjul per eiendom.

create table if not exists annual_wheel_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  month integer not null default 1 check (month between 1 and 12),
  due_date date,
  category text not null default 'Annet',
  responsible text,
  status text not null default 'Planlagt',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table annual_wheel_items add column if not exists property_id uuid references properties(id) on delete cascade;
alter table annual_wheel_items add column if not exists title text;
alter table annual_wheel_items add column if not exists month integer not null default 1;
alter table annual_wheel_items add column if not exists due_date date;
alter table annual_wheel_items add column if not exists category text not null default 'Annet';
alter table annual_wheel_items add column if not exists responsible text;
alter table annual_wheel_items add column if not exists status text not null default 'Planlagt';
alter table annual_wheel_items add column if not exists notes text;
alter table annual_wheel_items add column if not exists created_by uuid;
alter table annual_wheel_items add column if not exists updated_at timestamptz not null default now();

alter table annual_wheel_items enable row level security;

drop policy if exists annual_wheel_items_select_property_access on annual_wheel_items;
create policy annual_wheel_items_select_property_access
on annual_wheel_items for select
to authenticated
using (has_property_access(property_id));

drop policy if exists annual_wheel_items_write_property_access on annual_wheel_items;
create policy annual_wheel_items_write_property_access
on annual_wheel_items for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
