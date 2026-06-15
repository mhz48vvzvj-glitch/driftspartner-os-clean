-- Driftspartner OS - AI Director V1
-- Kjor hele filen i Supabase SQL Editor.
-- Logger AI-kjoringer per eiendom og sikrer tilgang via property_access.

create table if not exists ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  agent text not null default 'AI Director',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  recommendation text not null,
  risk_level text not null default 'Medium',
  source text not null default 'AI Director',
  status text not null default 'Ny',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_agent_runs enable row level security;
alter table ai_recommendations enable row level security;

drop policy if exists ai_agent_runs_select_property_access on ai_agent_runs;
create policy ai_agent_runs_select_property_access
on ai_agent_runs for select
to authenticated
using (has_property_access(property_id));

drop policy if exists ai_agent_runs_write_property_access on ai_agent_runs;
create policy ai_agent_runs_write_property_access
on ai_agent_runs for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));

drop policy if exists ai_recommendations_select_property_access on ai_recommendations;
create policy ai_recommendations_select_property_access
on ai_recommendations for select
to authenticated
using (has_property_access(property_id));

drop policy if exists ai_recommendations_write_property_access on ai_recommendations;
create policy ai_recommendations_write_property_access
on ai_recommendations for all
to authenticated
using (has_property_access(property_id))
with check (has_property_access(property_id));
