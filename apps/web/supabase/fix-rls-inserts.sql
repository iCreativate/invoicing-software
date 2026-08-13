-- Unblock: "new row violates row-level security policy"
-- Run in Supabase SQL Editor as postgres (default). Safe to re-run.
--
-- schema.sql never enabled RLS. Later scripts did, and INSERT from the app
-- was denied (missing JWT and/or missing SELECT policy for RETURNING).
-- This turns RLS off on public tables so you can use the app. Re-enable
-- before production (migrations/20260812130000_rls_and_v2_foundations.sql).

grant usage on schema public to authenticated, anon, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated, service_role;

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I disable row level security', r.tablename);
  end loop;
end $$;

-- Storage uses the same error text. Allow any signed-in user on these buckets.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', false), ('receipts', 'receipts', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "logos_objects_workspace_access" on storage.objects;
create policy "logos_objects_workspace_access"
on storage.objects for all to authenticated
using (bucket_id = 'logos' and auth.uid() is not null)
with check (bucket_id = 'logos' and auth.uid() is not null);

drop policy if exists "receipts_objects_workspace_access" on storage.objects;
create policy "receipts_objects_workspace_access"
on storage.objects for all to authenticated
using (bucket_id = 'receipts' and auth.uid() is not null)
with check (bucket_id = 'receipts' and auth.uid() is not null);
