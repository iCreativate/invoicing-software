-- One-time backfill: set owner_id on rows created before the column existed.
-- Run in Supabase SQL Editor after schema.sql (owner_id columns present).
--
-- 1) Replace WORKSPACE_OWNER_UUID with your Supabase Auth user id (Dashboard → Authentication → Users),
--    or the business owner uuid you use for that workspace.
-- 2) Review counts in a transaction; uncomment COMMIT when satisfied.

begin;

-- Preview how many rows would change:
-- select count(*) from public.invoices where owner_id is null;
-- select count(*) from public.quotes where owner_id is null;

update public.invoices
set owner_id = 'WORKSPACE_OWNER_UUID'::uuid
where owner_id is null;

update public.quotes
set owner_id = 'WORKSPACE_OWNER_UUID'::uuid
where owner_id is null;

-- Optional: other tables if you had legacy rows
-- update public.expenses set owner_id = 'WORKSPACE_OWNER_UUID'::uuid where owner_id is null;
-- update public.recurring_schedules set owner_id = 'WORKSPACE_OWNER_UUID'::uuid where owner_id is null;

commit;
-- rollback;
