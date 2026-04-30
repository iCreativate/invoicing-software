-- Payroll worksheet + run snapshots. Safe to run in Supabase SQL Editor on its own.
-- Requires: public.employees (from main schema). Uses uuid_generate_v4() (enabled on Supabase by default).

-- Parent table for each payroll run (must exist before payroll_run_lines)
create table if not exists public.payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid,
  period text not null,
  pay_date date not null,
  employees_count integer not null default 0,
  total_amount numeric not null default 0,
  currency text not null default 'ZAR',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payroll_runs add column if not exists owner_id uuid;

create index if not exists payroll_runs_owner_id_idx on public.payroll_runs(owner_id);
create index if not exists payroll_runs_pay_date_idx on public.payroll_runs(pay_date desc);

-- Current editable amounts per employee (before “Run payroll”)
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

-- Line items saved when a run is executed
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
