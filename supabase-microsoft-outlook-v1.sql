-- Driftspartner OS - Microsoft 365 / Outlook V1
-- Kjor i Supabase SQL Editor for a lagre Microsoft-kobling per bruker/eiendom.

create table if not exists microsoft_connections (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  property_id uuid references properties(id) on delete cascade,
  microsoft_user_id text,
  email text not null,
  display_name text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(auth_user_id, property_id)
);

create table if not exists microsoft_oauth_states (
  state text primary key,
  auth_user_id uuid not null,
  user_email text,
  property_id uuid references properties(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table microsoft_connections enable row level security;
alter table microsoft_oauth_states enable row level security;

drop policy if exists microsoft_connections_select_own on microsoft_connections;
create policy microsoft_connections_select_own
on microsoft_connections for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists microsoft_connections_delete_own on microsoft_connections;
create policy microsoft_connections_delete_own
on microsoft_connections for delete
to authenticated
using (auth.uid() = auth_user_id);

-- OAuth state og token-skriving gjøres via Netlify Functions med service role.
-- Ikke lag åpne insert/update-policyer for authenticated her.

create index if not exists microsoft_connections_auth_user_idx
on microsoft_connections(auth_user_id);

create index if not exists microsoft_connections_property_idx
on microsoft_connections(property_id);

create index if not exists microsoft_oauth_states_created_idx
on microsoft_oauth_states(created_at);
