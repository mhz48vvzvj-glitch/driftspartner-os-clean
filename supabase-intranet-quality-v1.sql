-- Driftspartner OS - Internt kvalitetssystem / intranett V1
-- Kjor hele filen i Supabase SQL Editor.
-- Dette er bare for ansatte i Driftspartner Nord, ikke kundedata.

create table if not exists internal_documents (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  title text not null,
  version text not null default '1.0',
  body text not null,
  audience_roles text[] not null default array['selger','salgssjef','admin'],
  requires_ack boolean not null default true,
  status text not null default 'Aktiv',
  created_by_email text,
  approved_by_email text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists internal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references internal_documents(id) on delete cascade,
  version text not null,
  body text not null,
  change_note text,
  created_by_email text,
  created_at timestamptz not null default now()
);

create table if not exists internal_document_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  document_key text not null,
  document_title text not null,
  version text not null default '1.0',
  user_id uuid,
  email text not null,
  role text,
  signature_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz not null default now(),
  unique(document_key,email)
);

create table if not exists internal_employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  name text not null,
  email text not null unique,
  phone text,
  internal_role text not null default 'selger',
  status text not null default 'Aktiv',
  manager_email text,
  started_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists internal_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  applies_to_roles text[] not null default array['selger','salgssjef','admin'],
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists internal_onboarding_tasks_title_key on internal_onboarding_tasks(title);

create table if not exists internal_employee_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_email text not null,
  task_id uuid references internal_onboarding_tasks(id) on delete set null,
  title text not null,
  status text not null default 'Ny',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists internal_deviations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null,
  severity text not null default 'Normal',
  description text not null,
  status text not null default 'Ny',
  reported_by_email text,
  assigned_to_email text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists internal_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  module text not null,
  description text,
  body text,
  status text not null default 'Aktiv',
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists internal_approvals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  approval_type text not null,
  requested_by_email text,
  approver_email text,
  status text not null default 'Til godkjenning',
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

alter table internal_documents enable row level security;
alter table internal_document_versions enable row level security;
alter table internal_document_acknowledgements enable row level security;
alter table internal_employees enable row level security;
alter table internal_onboarding_tasks enable row level security;
alter table internal_employee_tasks enable row level security;
alter table internal_deviations enable row level security;
alter table internal_templates enable row level security;
alter table internal_approvals enable row level security;

create or replace function dp_internal_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select lower(coalesce(role::text, ''))
  from app_users
  where auth_user_id = auth.uid()
     or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

create or replace function dp_is_internal_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(dp_internal_role() in ('superadmin','admin','selger'), false)
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'internal_documents',
    'internal_document_versions',
    'internal_document_acknowledgements',
    'internal_employees',
    'internal_onboarding_tasks',
    'internal_employee_tasks',
    'internal_deviations',
    'internal_templates',
    'internal_approvals'
  ]
  loop
    execute format('drop policy if exists %I on %I', table_name || '_internal_select', table_name);
    execute format('create policy %I on %I for select to authenticated using (dp_is_internal_staff())', table_name || '_internal_select', table_name);
    execute format('drop policy if exists %I on %I', table_name || '_internal_write', table_name);
    execute format('create policy %I on %I for all to authenticated using (dp_is_internal_staff()) with check (dp_is_internal_staff())', table_name || '_internal_write', table_name);
  end loop;
end $$;

insert into internal_onboarding_tasks (title, description, sort_order)
values
  ('Les ansatthandbok', 'Signeres for oppstart.', 1),
  ('Les IT- og sikkerhetsregler', 'Signeres for tilgang gis.', 2),
  ('Gjennomfor produktdemo', 'Start, Pro og Premium.', 3),
  ('Les salgshandbok', 'Gjelder selger og salgssjef.', 4),
  ('Sett opp e-post og kalender', 'Intern rutine.', 5),
  ('Gjennomga CRM-rutine', 'Lead og oppfolging.', 6),
  ('Avklar provisjon/bonus', 'Dokumenteres av leder.', 7)
on conflict (title) do nothing;
