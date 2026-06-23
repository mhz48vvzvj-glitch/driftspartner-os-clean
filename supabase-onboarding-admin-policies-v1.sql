-- Driftspartner OS - Onboarding admin policies V1
-- Kjor hele filen i Supabase SQL Editor.
-- Gir superadmin/forvalter lov til a opprette kunder og eiendommer.

create or replace function dp_current_app_role_text()
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

create or replace function is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select dp_current_app_role_text() in ('superadmin', 'admin', 'forvalter')
$$;

alter table customers enable row level security;
alter table properties enable row level security;
alter table property_access enable row level security;

drop policy if exists customers_select_app_admin on customers;
create policy customers_select_app_admin
on customers for select
to authenticated
using (is_app_admin());

drop policy if exists customers_insert_app_admin on customers;
create policy customers_insert_app_admin
on customers for insert
to authenticated
with check (is_app_admin());

drop policy if exists customers_update_app_admin on customers;
create policy customers_update_app_admin
on customers for update
to authenticated
using (is_app_admin())
with check (is_app_admin());

drop policy if exists properties_select_app_admin on properties;
create policy properties_select_app_admin
on properties for select
to authenticated
using (is_app_admin() or has_property_access(id));

drop policy if exists properties_insert_app_admin on properties;
create policy properties_insert_app_admin
on properties for insert
to authenticated
with check (is_app_admin());

drop policy if exists properties_update_app_admin on properties;
create policy properties_update_app_admin
on properties for update
to authenticated
using (is_app_admin() or has_property_access(id))
with check (is_app_admin() or has_property_access(id));

drop policy if exists property_access_select_app_admin on property_access;
create policy property_access_select_app_admin
on property_access for select
to authenticated
using (is_app_admin() or user_id in (
  select id from app_users
  where auth_user_id = auth.uid()
     or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
));

drop policy if exists property_access_write_app_admin on property_access;
create policy property_access_write_app_admin
on property_access for all
to authenticated
using (is_app_admin())
with check (is_app_admin());
