-- Driftspartner OS - streng kunde/eiendom-tilgang V3
-- Kjor hele filen i Supabase SQL Editor.
-- Formal: vanlige kunder skal IKKE kunne opprette nye kunder eller eiendommer.
-- Kun superadmin og intern admin kan opprette kunder, eiendommer og property_access.

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

alter table customers enable row level security;
alter table properties enable row level security;
alter table property_access enable row level security;

-- Fjern alle gamle policies pa disse kjerne-tabellene, inkludert demo-policyer.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('customers', 'properties', 'property_access')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Kunder:
-- Superadmin ser alt. Vanlig bruker ser bare kunde dersom brukeren har tilgang til en eiendom under kunden.
create policy dp_customers_select_strict
on customers for select
to authenticated
using (
  dp_can_onboard_customer()
  or exists (
    select 1
    from properties p
    where p.customer_id = customers.id
      and has_property_access(p.id)
  )
);

create policy dp_customers_insert_strict
on customers for insert
to authenticated
with check (dp_can_onboard_customer());

create policy dp_customers_update_strict
on customers for update
to authenticated
using (dp_can_onboard_customer())
with check (dp_can_onboard_customer());

create policy dp_customers_delete_strict
on customers for delete
to authenticated
using (dp_can_onboard_customer());

-- Eiendommer:
-- Superadmin kan opprette og endre. Vanlige brukere kan lese egne eiendommer.
create policy dp_properties_select_strict
on properties for select
to authenticated
using (dp_can_onboard_customer() or has_property_access(id));

create policy dp_properties_insert_strict
on properties for insert
to authenticated
with check (dp_can_onboard_customer());

create policy dp_properties_update_strict
on properties for update
to authenticated
using (dp_can_onboard_customer())
with check (dp_can_onboard_customer());

create policy dp_properties_delete_strict
on properties for delete
to authenticated
using (dp_can_onboard_customer());

-- Property access:
-- Superadmin kan administrere tilgang. Bruker kan lese sin egen tilgang.
create policy dp_property_access_select_strict
on property_access for select
to authenticated
using (
  dp_can_onboard_customer()
  or user_id in (
    select id
    from app_users
    where auth_user_id = auth.uid()
       or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create policy dp_property_access_insert_strict
on property_access for insert
to authenticated
with check (dp_can_onboard_customer());

create policy dp_property_access_update_strict
on property_access for update
to authenticated
using (dp_can_onboard_customer())
with check (dp_can_onboard_customer());

create policy dp_property_access_delete_strict
on property_access for delete
to authenticated
using (dp_can_onboard_customer());
