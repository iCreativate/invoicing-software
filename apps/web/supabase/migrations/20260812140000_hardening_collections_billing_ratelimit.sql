-- TimelyInvoices 2.0 hardening: collections step dedupe, SaaS subscriptions, rate limits.
-- Additive only.

-- ---------------------------------------------------------------------------
-- Reminder events: sequence step linkage for idempotent automation
-- ---------------------------------------------------------------------------
alter table public.reminder_events add column if not exists sequence_step_id uuid;
alter table public.reminder_events add column if not exists offset_days int;
alter table public.reminder_events add column if not exists owner_id uuid;

create unique index if not exists reminder_events_invoice_offset_channel_uidx
  on public.reminder_events (invoice_id, offset_days, channel)
  where offset_days is not null;

-- ---------------------------------------------------------------------------
-- Platform SaaS subscriptions (PayFast recurring for TimelyInvoices plans)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null unique,
  plan text not null default 'free', -- free|starter|pro|business
  status text not null default 'inactive', -- inactive|active|past_due|cancelled|cancel_at_period_end
  m_payment_id text,
  payfast_token text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_subscriptions_status_idx on public.platform_subscriptions(status);
create index if not exists platform_subscriptions_m_payment_id_idx on public.platform_subscriptions(m_payment_id);

alter table public.platform_subscriptions enable row level security;
drop policy if exists platform_subscriptions_select on public.platform_subscriptions;
create policy platform_subscriptions_select on public.platform_subscriptions for select to authenticated
  using (public.ti_is_workspace_member(owner_id));
-- inserts/updates via service role (webhooks / checkout)

-- ---------------------------------------------------------------------------
-- Rate limit buckets (multi-instance safe)
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limit_buckets (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

create index if not exists rate_limit_buckets_window_idx on public.rate_limit_buckets(window_start);

-- No RLS needed for authenticated app users; only service role writes.
alter table public.rate_limit_buckets enable row level security;
-- Deny all to authenticated/anon by default (no policies) — service role bypasses RLS.
