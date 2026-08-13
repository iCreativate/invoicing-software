-- One-time backfill: set owner_id on rows created before the column existed.
-- Skip on a fresh database — there is nothing to update.
--
-- If you do have legacy rows:
--   1) Copy your user id from Supabase → Authentication → Users
--   2) Replace YOUR_AUTH_USER_UUID below
--   3) Run this file

do $$
declare
  inv_null bigint;
  quote_null bigint;
begin
  select count(*) into inv_null from public.invoices where owner_id is null;
  select count(*) into quote_null from public.quotes where owner_id is null;

  if inv_null = 0 and quote_null = 0 then
    raise notice 'Nothing to backfill (no invoices/quotes with null owner_id). Skip this file.';
    return;
  end if;

  raise exception
    'This file still has a placeholder UUID. Replace YOUR_AUTH_USER_UUID with your Auth user id (Authentication → Users). % invoices and % quotes need owner_id.',
    inv_null,
    quote_null;
end $$;

-- Uncomment after replacing YOUR_AUTH_USER_UUID:
--
-- begin;
-- update public.invoices
-- set owner_id = 'YOUR_AUTH_USER_UUID'::uuid
-- where owner_id is null;
--
-- update public.quotes
-- set owner_id = 'YOUR_AUTH_USER_UUID'::uuid
-- where owner_id is null;
-- commit;
