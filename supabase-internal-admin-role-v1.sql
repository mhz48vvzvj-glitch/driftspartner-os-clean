-- Driftspartner OS - intern admin under superadmin
-- Kjor i Supabase SQL Editor.
-- Brukes for salgsjef/admin som skal ha kundeadmin-rettigheter,
-- men ikke vaere ekte superadmin.

do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    alter type app_role add value if not exists 'admin';
  end if;
end $$;

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
