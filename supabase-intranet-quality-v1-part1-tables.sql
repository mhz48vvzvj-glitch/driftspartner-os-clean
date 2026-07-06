-- Driftspartner OS - Intranett V1 del 1
-- Kjor forst: lager interne tabeller.

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
