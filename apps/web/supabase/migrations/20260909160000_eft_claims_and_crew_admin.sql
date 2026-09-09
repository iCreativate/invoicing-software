-- TimelyInvoices: Pay-by-EFT claims + Timely crew admin foundations.
-- Additive only. Bank details stay in env — never hardcode in SQL/app.

-- ---------------------------------------------------------------------------
-- Soft account lifecycle flags on company_profiles
-- ---------------------------------------------------------------------------
alter table public.company_profiles
  add column if not exists suspended_at timestamptz;

alter table public.company_profiles
  add column if not exists terminated_at timestamptz;

alter table public.company_profiles
  add column if not exists account_status text not null default 'active';
-- active | suspended | terminated

create index if not exists company_profiles_account_status_idx
  on public.company_profiles(account_status);

-- Mirror soft-terminate on SaaS subscription row when present
alter table public.platform_subscriptions
  add column if not exists suspended_at timestamptz;

alter table public.platform_subscriptions
  add column if not exists terminated_at timestamptz;

-- ---------------------------------------------------------------------------
-- EFT payment claims (customer says "I've paid")
-- ---------------------------------------------------------------------------
create table if not exists public.eft_payment_claims (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  plan text not null check (plan in ('pro', 'business')),
  amount_cents int not null check (amount_cents > 0),
  reference text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create index if not exists eft_payment_claims_status_idx
  on public.eft_payment_claims(status, created_at desc);

create index if not exists eft_payment_claims_owner_idx
  on public.eft_payment_claims(owner_id, created_at desc);

create unique index if not exists eft_payment_claims_pending_owner_plan_uidx
  on public.eft_payment_claims(owner_id, plan)
  where status = 'pending';

alter table public.eft_payment_claims enable row level security;

-- Workspace members can read their own claims
drop policy if exists eft_payment_claims_select_own on public.eft_payment_claims;
create policy eft_payment_claims_select_own on public.eft_payment_claims
  for select to authenticated
  using (public.ti_is_workspace_member(owner_id));

-- Workspace owners/admins insert via authenticated (API still checks permission)
drop policy if exists eft_payment_claims_insert_own on public.eft_payment_claims;
create policy eft_payment_claims_insert_own on public.eft_payment_claims
  for insert to authenticated
  with check (public.ti_is_workspace_member(owner_id));

-- Updates (approve/reject) via service role only — no update policy for authenticated

-- ---------------------------------------------------------------------------
-- Crew audit log (Timely staff actions — not tenant audit_logs)
-- ---------------------------------------------------------------------------
create table if not exists public.crew_audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid,
  actor_email text,
  action text not null,
  target_owner_id uuid,
  entity_type text,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists crew_audit_log_created_idx
  on public.crew_audit_log(created_at desc);

create index if not exists crew_audit_log_target_idx
  on public.crew_audit_log(target_owner_id, created_at desc);

alter table public.crew_audit_log enable row level security;
-- No policies for authenticated/anon — service role only (crew APIs).
