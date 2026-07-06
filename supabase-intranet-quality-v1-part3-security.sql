-- Driftspartner OS - Intranett V1 del 3
-- Kjor etter del 1 og 2: aktiverer sikkerhet og intern rollefunksjon.

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
