-- Driftspartner OS - Onboarding admin policies V2
-- Kjor kun denne filen i Supabase SQL Editor.
-- Denne bruker IKKE current_app_role(), sa den krasjer ikke med gamle funksjoner.

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
  select coalesce(dp_onboarding_role() in ('superadmin', 'admin', 'forvalter'), false)
$$;

alter table customers enable row level security;
alter table properties enable row level security;
alter table property_access enable row level security;

drop policy if exists dp_customers_select_onboarding_admin on customers;
create policy dp_customers_select_onboarding_admin
on customers for select
to authenticated
using (dp_can_onboard_customer());

drop policy if exists dp_customers_insert_onboarding_admin on customers;
create policy dp_customers_insert_onboarding_admin
on customers for insert
to authenticated
with check (dp_can_onboard_customer());

drop policy if exists dp_customers_update_onboarding_admin on customers;
create policy dp_customers_update_onboarding_admin
on customers for update
to authenticated
using (dp_can_onboard_customer())
with check (dp_can_onboard_customer());

drop policy if exists dp_properties_select_onboarding_admin on properties;
create policy dp_properties_select_onboarding_admin
on properties for select
to authenticated
using (dp_can_onboard_customer() or has_property_access(id));

drop policy if exists dp_properties_insert_onboarding_admin on properties;
create policy dp_properties_insert_onboarding_admin
on properties for insert
to authenticated
with check (dp_can_onboard_customer());

drop policy if exists dp_properties_update_onboarding_admin on properties;
create policy dp_properties_update_onboarding_admin
on properties for update
to authenticated
using (dp_can_onboard_customer() or has_property_access(id))
with check (dp_can_onboard_customer() or has_property_access(id));

drop policy if exists dp_property_access_select_onboarding_admin on property_access;
create policy dp_property_access_select_onboarding_admin
on property_access for select
to authenticated
using (dp_can_onboard_customer() or user_id in (
  select id from app_users
  where auth_user_id = auth.uid()
     or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
));

drop policy if exists dp_property_access_write_onboarding_admin on property_access;
create policy dp_property_access_write_onboarding_admin
on property_access for all
to authenticated
using (dp_can_onboard_customer())
with check (dp_can_onboard_customer());
