-- Run in Supabase: SQL Editor (or `psql` against your project).
-- Creates the private `receipts` bucket and RLS policies aligned with app paths:
--   {workspace_owner_uuid}/receipts/{filename}
--
-- Solo accounts: first folder = auth.uid()
-- Team members: first folder = employees.owner_id for their email (JWT email)

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = excluded.public;

-- Replace if you re-run this file
drop policy if exists "receipts_objects_workspace_access" on storage.objects;

create policy "receipts_objects_workspace_access"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'receipts'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.employees e
      where lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
        and e.owner_id is not null
        and e.owner_id::text = split_part(name, '/', 1)
    )
  )
)
with check (
  bucket_id = 'receipts'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.employees e
      where lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
        and e.owner_id is not null
        and e.owner_id::text = split_part(name, '/', 1)
    )
  )
);
