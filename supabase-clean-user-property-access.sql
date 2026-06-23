-- Driftspartner OS - rydd tilgang for én bruker
-- Bruk denne hvis en bruker ser eiendommer de ikke skal se.
--
-- Slik bruker du:
-- 1. Bytt e-post under target_user_email.
-- 2. Bytt property_id under allowed_property_id til eiendommen brukeren SKAL se.
-- 3. Kjor hele filen i Supabase SQL Editor.

with settings as (
  select
    lower('bruker@kunde.no')::text as target_user_email,
    '00000000-0000-0000-0000-000000000000'::uuid as allowed_property_id
),
target_user as (
  select au.id
  from app_users au
  join settings s on lower(au.email) = s.target_user_email
  limit 1
)
delete from property_access pa
using target_user tu, settings s
where pa.user_id = tu.id
  and pa.property_id <> s.allowed_property_id;

-- Kontroller resultatet etterpå.
with settings as (
  select lower('bruker@kunde.no')::text as target_user_email
)
select
  au.name,
  au.email,
  au.role,
  p.name as property_name,
  pa.access_role
from app_users au
join property_access pa on pa.user_id = au.id
join properties p on p.id = pa.property_id
join settings s on lower(au.email) = s.target_user_email
order by p.name;
