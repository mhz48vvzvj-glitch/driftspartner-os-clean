-- Driftspartner OS - Okonomi V1
-- Kjor hele filen i Supabase SQL Editor. Trygg a kjore flere ganger.

create table if not exists property_finance (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  bank_balance numeric not null default 0,
  reserved_funds numeric not null default 0,
  project_funds numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id)
);

create table if not exists budget_lines (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  category text not null,
  budget_amount numeric not null default 0,
  actual_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  description text,
  budget numeric not null default 0,
  actual_cost numeric not null default 0,
  due_date date,
  status text not null default 'Planlagt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table property_finance add column if not exists bank_balance numeric not null default 0;
alter table property_finance add column if not exists reserved_funds numeric not null default 0;
alter table property_finance add column if not exists project_funds numeric not null default 0;
alter table property_finance add column if not exists notes text;
alter table property_finance add column if not exists updated_at timestamptz not null default now();

alter table budget_lines add column if not exists category text;
alter table budget_lines add column if not exists label text;
alter table budget_lines add column if not exists budget_amount numeric not null default 0;
alter table budget_lines add column if not exists actual_amount numeric not null default 0;
alter table budget_lines add column if not exists budget numeric not null default 0;
alter table budget_lines add column if not exists actual numeric not null default 0;
alter table budget_lines add column if not exists notes text;
alter table budget_lines add column if not exists updated_at timestamptz not null default now();

update budget_lines
set category = coalesce(category, label, 'Budsjett')
where category is null;

update budget_lines
set label = coalesce(label, category, 'Budsjett')
where label is null;

update budget_lines
set budget_amount = coalesce(budget_amount, budget, 0),
    actual_amount = coalesce(actual_amount, actual, 0),
    budget = coalesce(budget, budget_amount, 0),
    actual = coalesce(actual, actual_amount, 0);

alter table projects add column if not exists actual_cost numeric not null default 0;
alter table projects add column if not exists due_date date;
alter table projects add column if not exists description text;
alter table projects add column if not exists status text not null default 'Planlagt';
alter table projects add column if not exists updated_at timestamptz not null default now();

alter table property_finance enable row level security;
alter table budget_lines enable row level security;
alter table projects enable row level security;

drop policy if exists property_finance_select_property_access on property_finance;
create policy property_finance_select_property_access
on property_finance for select
to authenticated
using (has_property_access(property_id));

drop policy if exists property_finance_write_property_access on property_finance;
create policy property_finance_write_property_access
on property_finance for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));

drop policy if exists budget_lines_select_property_access on budget_lines;
create policy budget_lines_select_property_access
on budget_lines for select
to authenticated
using (has_property_access(property_id));

drop policy if exists budget_lines_write_property_access on budget_lines;
create policy budget_lines_write_property_access
on budget_lines for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));

drop policy if exists projects_select_property_access on projects;
create policy projects_select_property_access
on projects for select
to authenticated
using (has_property_access(property_id));

drop policy if exists projects_write_property_access on projects;
create policy projects_write_property_access
on projects for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
