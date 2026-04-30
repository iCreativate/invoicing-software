-- Run in Supabase SQL Editor. Creates private bucket `logos` + RLS for uploads.
-- Object keys must match the app: `{workspace_owner_uuid}/logo.{ext}`
-- Next.js serves images via /api/storage/logo using the caller’s session (read).
-- Without this bucket, logo uploads from Settings will fail.

insert into storage.buckets (id, name, public)
values ('logos', 'logos', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "logos_objects_workspace_access" on storage.objects;

create policy "logos_objects_workspace_access"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'logos'
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
  bucket_id = 'logos'
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
