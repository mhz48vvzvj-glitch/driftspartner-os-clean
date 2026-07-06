-- Driftspartner OS - Intranett V1 del 2
-- Kjor etter del 1: lager oppgaver, avvik, maler og godkjenninger.

create table if not exists internal_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  applies_to_roles text[] not null default array['selger','salgssjef','admin'],
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists internal_onboarding_tasks_title_key
on internal_onboarding_tasks(title);

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
