-- TimelyInvoices minimal schema (dev-friendly)
-- Creates: clients, invoices, invoice_items, payments
-- Notes:
-- - RLS is NOT enabled here to keep local/dev unblocked.
-- - Add RLS + policies before production.

create extension if not exists "uuid-ossp";

-- Clients
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  -- Workspace owner user id (same value used by invoices.owner_id).
  -- Note: kept nullable for legacy rows; backfill via `supabase/backfill-client-owner-id.sql`.
  owner_id uuid,
  name text not null,
  email text,
  phone text,
  address text,
  company_name text,
  website text,
  company_registration text,
  vat_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients add column if not exists owner_id uuid;
alter table public.clients add column if not exists company_name text;
alter table public.clients add column if not exists website text;
alter table public.clients add column if not exists company_registration text;
alter table public.clients add column if not exists vat_number text;

create index if not exists clients_owner_id_idx on public.clients(owner_id);
create index if not exists clients_name_idx on public.clients(name);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text,
  status text not null default 'draft', -- draft|sent|partial|paid|overdue|cancelled
  issue_date date not null default now(),
  due_date date not null default (now()::date + 30),
  paid_date date,
  sent_at timestamptz,

  -- Owner (authenticated user)
  owner_id uuid,

  currency text not null default 'ZAR',
  vat_rate numeric not null default 15,
  subtotal_amount numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  balance_amount numeric not null default 0,

  template_id text,
  notes text,

  public_share_id uuid unique,

  client_id uuid not null references public.clients(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legacy DBs: table may exist without owner_id; indexes below require this column.
alter table public.invoices add column if not exists owner_id uuid;

create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists invoices_owner_id_idx on public.invoices(owner_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);
create index if not exists invoices_public_share_id_idx on public.invoices(public_share_id);

-- Invoice Items
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  tax_rate numeric not null default 15,
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
create index if not exists invoice_items_description_idx on public.invoice_items(description);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'ZAR',
  method text not null default 'bank_transfer',
  status text not null default 'completed',
  payment_date date not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- Gateway / integration metadata (PayFast, Stripe, Yoco, etc.)
alter table public.payments add column if not exists provider text;
alter table public.payments add column if not exists external_reference text;

create index if not exists payments_invoice_id_idx on public.payments(invoice_id);
create index if not exists payments_payment_date_idx on public.payments(payment_date desc);

-- Reminder sends (dashboard activity feed)
create table if not exists public.reminder_events (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  channel text not null,
  sent_at timestamptz not null default now()
);

create index if not exists reminder_events_invoice_id_idx on public.reminder_events(invoice_id);
create index if not exists reminder_events_sent_at_idx on public.reminder_events(sent_at desc);

-- Invoice timeline (created, sent, viewed, paid, etc.)
create table if not exists public.invoice_timeline_events (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists invoice_timeline_invoice_id_idx on public.invoice_timeline_events(invoice_id);
create index if not exists invoice_timeline_occurred_at_idx on public.invoice_timeline_events(occurred_at desc);

-- Catalog: products, services, and inventory (line-item presets per workspace)
create table if not exists public.catalog_items (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  item_type text not null check (item_type in ('service', 'product', 'inventory')),
  name text not null,
  description text,
  sku text,
  unit text,
  unit_price numeric not null default 0,
  default_tax_rate numeric,
  stock_quantity numeric,
  cost_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_items_owner_id_idx on public.catalog_items(owner_id);
create index if not exists catalog_items_item_type_idx on public.catalog_items(item_type);
create index if not exists catalog_items_name_idx on public.catalog_items(name);

-- Link invoice lines to catalog; track when stock was deducted for a sent invoice
alter table public.invoice_items add column if not exists catalog_item_id uuid references public.catalog_items(id) on delete set null;
create index if not exists invoice_items_catalog_item_id_idx on public.invoice_items(catalog_item_id);

alter table public.invoices add column if not exists inventory_deducted_at timestamptz;

-- Company profile / branding
-- One row per authenticated user (owner_id). RLS intentionally omitted for dev.
create table if not exists public.company_profiles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid unique,
  company_name text not null,
  email text,
  phone text,
  address text,
  website text,
  vat_number text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_profiles_owner_id_idx on public.company_profiles(owner_id);

-- Optional banking details (for invoices)
alter table public.company_profiles add column if not exists bank_name text;
alter table public.company_profiles add column if not exists account_name text;
alter table public.company_profiles add column if not exists account_number text;
alter table public.company_profiles add column if not exists branch_code text;
alter table public.company_profiles add column if not exists account_type text;

-- Payment sessions (gateway-agnostic)
create table if not exists public.payment_sessions (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  provider text not null, -- payfast|ozow|snapscan|card
  method text, -- instant_eft|card|qr|etc
  amount numeric not null,
  currency text not null default 'ZAR',
  status text not null default 'created', -- created|pending|paid|failed|cancelled|expired
  reference text, -- provider reference or our reference
  redirect_url text, -- hosted pay url (if any)
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_sessions_invoice_id_idx on public.payment_sessions(invoice_id);
create index if not exists payment_sessions_status_idx on public.payment_sessions(status);
create index if not exists payment_sessions_provider_idx on public.payment_sessions(provider);

-- Client portal access (password optional)
create table if not exists public.client_portals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  slug text unique not null,
  password_hash text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_portals_client_id_idx on public.client_portals(client_id);

-- Employees (team management)
create table if not exists public.employees (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid,
  name text not null,
  email text not null,
  role text not null default 'Employee',
  status text not null default 'invited', -- invited|active|inactive
  invited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees add column if not exists owner_id uuid;

create index if not exists employees_owner_id_idx on public.employees(owner_id);
create index if not exists employees_email_idx on public.employees(email);

-- Payroll runs
create table if not exists public.payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid,
  period text not null,
  pay_date date not null,
  employees_count integer not null default 0,
  total_amount numeric not null default 0,
  currency text not null default 'ZAR',
  status text not null default 'draft', -- draft|processing|paid
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payroll_runs add column if not exists owner_id uuid;

create index if not exists payroll_runs_owner_id_idx on public.payroll_runs(owner_id);
create index if not exists payroll_runs_pay_date_idx on public.payroll_runs(pay_date desc);

-- Payroll: per-employee compensation (current period / draft before run)
create table if not exists public.payroll_compensation (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  base_salary numeric not null default 0,
  bonus numeric not null default 0,
  deductions numeric not null default 0,
  currency text not null default 'ZAR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, employee_id)
);

create index if not exists payroll_compensation_owner_id_idx on public.payroll_compensation(owner_id);
create index if not exists payroll_compensation_employee_id_idx on public.payroll_compensation(employee_id);

-- Payroll run line items (snapshot when a run is executed)
create table if not exists public.payroll_run_lines (
  id uuid primary key default uuid_generate_v4(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  employee_name text not null,
  base_salary numeric not null default 0,
  bonus numeric not null default 0,
  deductions numeric not null default 0,
  net_pay numeric not null default 0,
  currency text not null default 'ZAR',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists payroll_run_lines_run_id_idx on public.payroll_run_lines(payroll_run_id);

-- Plans: free|starter|pro|business (controls “Powered by” on invoices for free)
alter table public.company_profiles add column if not exists subscription_plan text not null default 'free';
alter table public.company_profiles add column if not exists preferred_locale text not null default 'en';
alter table public.company_profiles add column if not exists base_currency text not null default 'ZAR';
alter table public.company_profiles add column if not exists referral_code text unique;
alter table public.company_profiles add column if not exists referred_by_code text;

-- Quotes (convert to invoice)
create table if not exists public.quotes (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid,
  client_id uuid not null references public.clients(id) on delete restrict,
  quote_number text,
  status text not null default 'draft', -- draft|sent|accepted|declined|converted
  issue_date date not null default (now()::date),
  valid_until date not null default ((now()::date) + 14),
  currency text not null default 'ZAR',
  vat_rate numeric not null default 15,
  subtotal_amount numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  notes text,
  converted_invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes add column if not exists owner_id uuid;

create index if not exists quotes_owner_id_idx on public.quotes(owner_id);
create index if not exists quotes_client_id_idx on public.quotes(client_id);

create table if not exists public.quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  tax_rate numeric not null default 15,
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quote_items_quote_id_idx on public.quote_items(quote_id);

-- Expenses + receipt path (private bucket optional; path stored only)
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
alter table public.expenses add column if not exists source text not null default 'manual';

create index if not exists expenses_owner_id_idx on public.expenses(owner_id);
create index if not exists expenses_expense_date_idx on public.expenses(expense_date desc);

-- Recurring invoices + reminder prefs (runner via cron /api/cron/recurring)
create table if not exists public.recurring_schedules (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null default 'Recurring invoice',
  line_description text not null default 'Services',
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  vat_rate numeric not null default 15,
  currency text not null default 'ZAR',
  frequency text not null default 'monthly', -- weekly|monthly|quarterly
  next_run_date date not null default (now()::date + 30),
  reminder_days_before integer not null default 3,
  remind_email boolean not null default true,
  remind_whatsapp boolean not null default false,
  whatsapp_phone text,
  active boolean not null default true,
  last_generated_invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recurring_schedules add column if not exists owner_id uuid;

create index if not exists recurring_schedules_owner_id_idx on public.recurring_schedules(owner_id);
create index if not exists recurring_schedules_next_run_idx on public.recurring_schedules(next_run_date);

-- Referral ledger (reward credits in app currency)
create table if not exists public.referral_rewards (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  amount numeric not null default 0,
  currency text not null default 'ZAR',
  reason text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists referral_rewards_owner_id_idx on public.referral_rewards(owner_id);

-- Team permissions: extend employees
alter table public.employees add column if not exists permission text not null default 'member';
-- permission: owner|admin|billing|member|viewer

-- Invoice branding & outbound email bodies (per workspace / company_profiles)
alter table public.company_profiles add column if not exists invoice_accent_hex text;
alter table public.company_profiles add column if not exists invoice_header_hex text;
alter table public.company_profiles add column if not exists email_template_invoice text;
alter table public.company_profiles add column if not exists email_template_reminder text;

-- ---------------------------------------------------------------------------
-- After core schema: run these in order (SQL Editor):
--   1. This file (schema.sql) — tables + ALTER owner_id + indexes
--   2. supabase/storage-receipts.sql — bucket `receipts` + RLS policies
--   3. supabase/storage-logos.sql — bucket `logos` + RLS for company logo uploads
--   4. supabase/backfill-owner-id.sql — only if you have null owner_id rows
--   5. supabase/payroll-compensation.sql — if payroll_compensation / payroll_run_lines are missing
-- ---------------------------------------------------------------------------

