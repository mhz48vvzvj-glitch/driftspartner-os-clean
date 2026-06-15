-- Driftspartner OS - diagnose for property_contacts
-- Kjor i Supabase SQL Editor hvis styre/beboer fortsatt ikke lagres.

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'property_contacts'
order by ordinal_position;

select
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'property_contacts'
order by conname;
