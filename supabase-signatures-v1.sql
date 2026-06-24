-- Driftspartner OS - Signering V1
-- Kjor denne i Supabase SQL Editor for signeringsforesporsler per eiendom.

create table if not exists signature_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  signature_type text not null default 'Kontrakt',
  related_type text,
  related_id uuid,
  recipients jsonb not null default '[]'::jsonb,
  due_date date,
  status text not null default 'Utkast',
  notes text,
  sent_by_name text,
  sent_by_email text,
  sent_at timestamptz,
  signed_by_name text,
  signed_by_email text,
  signature_log jsonb not null default '[]'::jsonb,
  signed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table signature_requests add column if not exists property_id uuid references properties(id) on delete cascade;
alter table signature_requests add column if not exists title text;
alter table signature_requests add column if not exists signature_type text not null default 'Kontrakt';
alter table signature_requests add column if not exists related_type text;
alter table signature_requests add column if not exists related_id uuid;
alter table signature_requests add column if not exists recipients jsonb not null default '[]'::jsonb;
alter table signature_requests add column if not exists due_date date;
alter table signature_requests add column if not exists status text not null default 'Utkast';
alter table signature_requests add column if not exists notes text;
alter table signature_requests add column if not exists sent_by_name text;
alter table signature_requests add column if not exists sent_by_email text;
alter table signature_requests add column if not exists sent_at timestamptz;
alter table signature_requests add column if not exists signed_by_name text;
alter table signature_requests add column if not exists signed_by_email text;
alter table signature_requests add column if not exists signature_log jsonb not null default '[]'::jsonb;
alter table signature_requests add column if not exists signed_at timestamptz;
alter table signature_requests add column if not exists created_by uuid;
alter table signature_requests add column if not exists updated_at timestamptz not null default now();

alter table signature_requests enable row level security;

drop policy if exists signature_requests_select_property_access on signature_requests;
create policy signature_requests_select_property_access
on signature_requests for select
to authenticated
using (has_property_access(property_id));

drop policy if exists signature_requests_write_property_access on signature_requests;
create policy signature_requests_write_property_access
on signature_requests for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
