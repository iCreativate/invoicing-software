-- Expenses table. Run in Supabase SQL Editor if the app shows "Database table required" on /expenses.
-- Same DDL as public.expenses in apps/web/supabase/schema.sql (idempotent).

create extension if not exists "uuid-ossp";

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid,
  amount numeric not null,
  currency text not null default 'ZAR',
  category text not null default 'uncategorized',
  description text,
  receipt_path text,
  ai_category text,
  expense_date date not null default (now()::date),
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses add column if not exists owner_id uuid;
alter table public.expenses add column if not exists receipt_path text;
alter table public.expenses add column if not exists ai_category text;
alter table public.expenses add column if not exists source text not null default 'manual';

comment on column public.expenses.source is 'manual | import';

create index if not exists expenses_owner_id_idx on public.expenses(owner_id);
create index if not exists expenses_expense_date_idx on public.expenses(expense_date desc);
