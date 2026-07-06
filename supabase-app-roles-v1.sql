-- Driftspartner OS - roller for app_users
-- Kjor i Supabase SQL Editor hvis oppretting av bruker feiler for roller
-- som admin, vaktmester, leverandor eller superadmin.

do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    alter type app_role add value if not exists 'superadmin';
    alter type app_role add value if not exists 'admin';
    alter type app_role add value if not exists 'forvalter';
    alter type app_role add value if not exists 'styreleder';
    alter type app_role add value if not exists 'styremedlem';
    alter type app_role add value if not exists 'beboer';
    alter type app_role add value if not exists 'vaktmester';
    alter type app_role add value if not exists 'leverandor';
  end if;
end $$;

-- Hvis app_users.role er text i stedet for enum, gjor denne filen ingen skade.
