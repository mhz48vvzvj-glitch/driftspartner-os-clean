-- Driftspartner OS - intern admin under superadmin
-- Kjor i Supabase SQL Editor.
-- Brukes for salgsjef/admin som skal ha kundeadmin-rettigheter,
-- men ikke vaere ekte superadmin.
--
-- Viktig:
-- Hvis app_users har en gammel rolle-regel, ma den oppdateres sa rollen
-- "admin" og "selger" godtas. Dette scriptet rydder den regelen og lager den pa nytt.

do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    alter type app_role add value if not exists 'admin';
    alter type app_role add value if not exists 'selger';
  end if;
end $$;

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.app_users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.app_users drop constraint if exists %I', constraint_row.conname);
  end loop;
end $$;

alter table public.app_users
add constraint app_users_role_check
check (
  role::text in (
    'superadmin',
    'admin',
    'selger',
    'forvalter',
    'styreleder',
    'styremedlem',
    'beboer',
    'vaktmester',
    'leverandor'
  )
);

create or replace function dp_onboarding_role()
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

create or replace function dp_can_onboard_customer()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(dp_onboarding_role() in ('superadmin', 'admin'), false)
$$;

-- Gjor salgsjef til intern admin hvis brukeren allerede finnes i app_users.
update app_users
set role = 'admin'
where lower(email) = lower('salgsjef@driftspartnernord.no')
  and lower(role::text) <> 'superadmin';

-- Kontroll:
select id, name, email, role
from app_users
where lower(email) = lower('salgsjef@driftspartnernord.no');
