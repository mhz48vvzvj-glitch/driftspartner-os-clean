-- Driftspartner OS - Styremoter V1
-- Kjor denne i Supabase SQL Editor for styremote, agenda, vedtak, oppgaver og referat per eiendom.

create table if not exists board_meetings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  meeting_type text not null default 'Styremote',
  meeting_date timestamptz,
  status text not null default 'Planlagt',
  agenda text,
  decisions text,
  tasks text,
  minutes text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table board_meetings add column if not exists property_id uuid references properties(id) on delete cascade;
alter table board_meetings add column if not exists title text;
alter table board_meetings add column if not exists meeting_type text not null default 'Styremote';
alter table board_meetings add column if not exists meeting_date timestamptz;
alter table board_meetings add column if not exists status text not null default 'Planlagt';
alter table board_meetings add column if not exists agenda text;
alter table board_meetings add column if not exists decisions text;
alter table board_meetings add column if not exists tasks text;
alter table board_meetings add column if not exists minutes text;
alter table board_meetings add column if not exists notes text;
alter table board_meetings add column if not exists created_by uuid;
alter table board_meetings add column if not exists updated_at timestamptz not null default now();

alter table board_meetings enable row level security;

drop policy if exists board_meetings_select_property_access on board_meetings;
create policy board_meetings_select_property_access
on board_meetings for select
to authenticated
using (has_property_access(property_id));

drop policy if exists board_meetings_write_property_access on board_meetings;
create policy board_meetings_write_property_access
on board_meetings for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
