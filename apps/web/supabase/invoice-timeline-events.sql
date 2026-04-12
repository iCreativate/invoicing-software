-- Run in Supabase SQL Editor if you see PostgREST errors like:
-- "Could not find the table 'public.invoice_timeline_events' in the schema cache"
-- (Same DDL as in schema.sql; safe to re-run.)

create extension if not exists "uuid-ossp";

create table if not exists public.invoice_timeline_events (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists invoice_timeline_invoice_id_idx on public.invoice_timeline_events(invoice_id);
create index if not exists invoice_timeline_occurred_at_idx on public.invoice_timeline_events(occurred_at desc);
