-- Backfill clients.owner_id for legacy rows.
-- Strategy: if a client has invoices with owner_id set, pick the newest invoice.owner_id.
-- Safe to run multiple times; only fills NULL owner_id.

alter table public.clients add column if not exists owner_id uuid;

with latest as (
  select distinct on (i.client_id)
    i.client_id,
    i.owner_id
  from public.invoices i
  where i.owner_id is not null
  order by i.client_id, i.created_at desc nulls last
)
update public.clients c
set owner_id = latest.owner_id
from latest
where c.id = latest.client_id
  and c.owner_id is null;

