-- TimelyInvoices 2.0 foundations: RLS, lifecycle columns, payment events,
-- notifications, audit, collections, payment plans, employee uniqueness.
-- Additive only. Apply in Supabase SQL Editor after schema.sql.

-- ---------------------------------------------------------------------------
-- Invoice lifecycle timestamps
-- ---------------------------------------------------------------------------
alter table public.invoices add column if not exists viewed_at timestamptz;
alter table public.invoices add column if not exists delivered_at timestamptz;

-- ---------------------------------------------------------------------------
-- Payment events (webhook idempotency + history)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  external_event_id text,
  payment_session_id uuid references public.payment_sessions(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create index if not exists payment_events_invoice_id_idx on public.payment_events(invoice_id);
create index if not exists payment_events_session_id_idx on public.payment_events(payment_session_id);

-- ---------------------------------------------------------------------------
-- Payment plans (architecture; UI phased)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_schedules (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  label text not null default 'Payment plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_schedules_owner_id_idx on public.payment_schedules(owner_id);
create index if not exists payment_schedules_invoice_id_idx on public.payment_schedules(invoice_id);

create table if not exists public.payment_schedule_items (
  id uuid primary key default uuid_generate_v4(),
  schedule_id uuid not null references public.payment_schedules(id) on delete cascade,
  label text not null default 'Milestone',
  amount numeric not null check (amount >= 0),
  due_date date,
  status text not null default 'pending', -- pending|paid|overdue|cancelled
  paid_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists payment_schedule_items_schedule_id_idx on public.payment_schedule_items(schedule_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  user_id uuid,
  title text not null,
  body text,
  href text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_owner_id_idx on public.notifications(owner_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_owner_id_idx on public.audit_logs(owner_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Collections sequences
-- ---------------------------------------------------------------------------
create table if not exists public.collection_sequences (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  name text not null default 'Default collections',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collection_sequences_owner_id_idx on public.collection_sequences(owner_id);

create table if not exists public.collection_sequence_steps (
  id uuid primary key default uuid_generate_v4(),
  sequence_id uuid not null references public.collection_sequences(id) on delete cascade,
  offset_days int not null, -- negative = before due, 0 = due, positive = overdue
  channel text not null default 'email', -- email|whatsapp|sms
  template_key text not null default 'reminder',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists collection_sequence_steps_sequence_id_idx on public.collection_sequence_steps(sequence_id);

-- ---------------------------------------------------------------------------
-- Quotes: public share + accept metadata
-- ---------------------------------------------------------------------------
alter table public.quotes add column if not exists public_share_id uuid unique;
alter table public.quotes add column if not exists viewed_at timestamptz;
alter table public.quotes add column if not exists accepted_at timestamptz;
alter table public.quotes add column if not exists declined_at timestamptz;

-- ---------------------------------------------------------------------------
-- Employees: unique email per workspace
-- ---------------------------------------------------------------------------
create unique index if not exists employees_owner_email_uidx
  on public.employees (owner_id, lower(email))
  where owner_id is not null;

-- ---------------------------------------------------------------------------
-- Amount sanity checks (additive; skip if conflicting legacy data)
-- ---------------------------------------------------------------------------
do $$
begin
  alter table public.invoices add constraint invoices_amounts_nonneg
    check (subtotal_amount >= 0 and tax_amount >= 0 and total_amount >= 0 and paid_amount >= 0 and balance_amount >= 0);
exception when duplicate_object then null;
when check_violation then null;
end $$;

-- ---------------------------------------------------------------------------
-- Helper: workspace membership for RLS
-- ---------------------------------------------------------------------------
create or replace function public.ti_is_workspace_member(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = p_owner_id
    or exists (
      select 1
      from public.employees e
      where e.owner_id = p_owner_id
        and lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and e.status is distinct from 'inactive'
    );
$$;

revoke all on function public.ti_is_workspace_member(uuid) from public;
grant execute on function public.ti_is_workspace_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS + policies (tenant tables)
-- ---------------------------------------------------------------------------

-- clients
alter table public.clients enable row level security;
drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;
create policy clients_select on public.clients for select to authenticated
  using (public.ti_is_workspace_member(owner_id));
create policy clients_insert on public.clients for insert to authenticated
  with check (owner_id = auth.uid() or public.ti_is_workspace_member(owner_id));
create policy clients_update on public.clients for update to authenticated
  using (public.ti_is_workspace_member(owner_id));
create policy clients_delete on public.clients for delete to authenticated
  using (public.ti_is_workspace_member(owner_id));

-- invoices
alter table public.invoices enable row level security;
drop policy if exists invoices_select on public.invoices;
drop policy if exists invoices_insert on public.invoices;
drop policy if exists invoices_update on public.invoices;
drop policy if exists invoices_delete on public.invoices;
create policy invoices_select on public.invoices for select to authenticated
  using (public.ti_is_workspace_member(owner_id));
create policy invoices_insert on public.invoices for insert to authenticated
  with check (public.ti_is_workspace_member(owner_id));
create policy invoices_update on public.invoices for update to authenticated
  using (public.ti_is_workspace_member(owner_id));
create policy invoices_delete on public.invoices for delete to authenticated
  using (public.ti_is_workspace_member(owner_id));

-- Public share read via anon is handled by API using service role / share id filters — not open table.

-- invoice_items (via parent invoice ownership)
alter table public.invoice_items enable row level security;
drop policy if exists invoice_items_all on public.invoice_items;
create policy invoice_items_all on public.invoice_items for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  );

-- payments
alter table public.payments enable row level security;
drop policy if exists payments_all on public.payments;
create policy payments_all on public.payments for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  );

-- payment_sessions
alter table public.payment_sessions enable row level security;
drop policy if exists payment_sessions_all on public.payment_sessions;
create policy payment_sessions_all on public.payment_sessions for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  );

-- quotes
alter table public.quotes enable row level security;
drop policy if exists quotes_all on public.quotes;
create policy quotes_all on public.quotes for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

alter table public.quote_items enable row level security;
drop policy if exists quote_items_all on public.quote_items;
create policy quote_items_all on public.quote_items for all to authenticated
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.ti_is_workspace_member(q.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.ti_is_workspace_member(q.owner_id)
    )
  );

-- expenses
alter table public.expenses enable row level security;
drop policy if exists expenses_all on public.expenses;
create policy expenses_all on public.expenses for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

-- company_profiles
alter table public.company_profiles enable row level security;
drop policy if exists company_profiles_all on public.company_profiles;
create policy company_profiles_all on public.company_profiles for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

-- catalog_items
alter table public.catalog_items enable row level security;
drop policy if exists catalog_items_all on public.catalog_items;
create policy catalog_items_all on public.catalog_items for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

-- employees
alter table public.employees enable row level security;
drop policy if exists employees_all on public.employees;
create policy employees_all on public.employees for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

-- recurring_schedules
alter table public.recurring_schedules enable row level security;
drop policy if exists recurring_schedules_all on public.recurring_schedules;
create policy recurring_schedules_all on public.recurring_schedules for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

-- reminder_events
alter table public.reminder_events enable row level security;
drop policy if exists reminder_events_all on public.reminder_events;
create policy reminder_events_all on public.reminder_events for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  );

-- invoice_timeline_events
alter table public.invoice_timeline_events enable row level security;
drop policy if exists invoice_timeline_events_all on public.invoice_timeline_events;
create policy invoice_timeline_events_all on public.invoice_timeline_events for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  );

-- notifications / audit / collections / payment plans
alter table public.notifications enable row level security;
drop policy if exists notifications_all on public.notifications;
create policy notifications_all on public.notifications for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.ti_is_workspace_member(owner_id));
-- inserts via authenticated app or service role
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert to authenticated
  with check (public.ti_is_workspace_member(owner_id));

alter table public.collection_sequences enable row level security;
drop policy if exists collection_sequences_all on public.collection_sequences;
create policy collection_sequences_all on public.collection_sequences for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

alter table public.collection_sequence_steps enable row level security;
drop policy if exists collection_sequence_steps_all on public.collection_sequence_steps;
create policy collection_sequence_steps_all on public.collection_sequence_steps for all to authenticated
  using (
    exists (
      select 1 from public.collection_sequences s
      where s.id = sequence_id and public.ti_is_workspace_member(s.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.collection_sequences s
      where s.id = sequence_id and public.ti_is_workspace_member(s.owner_id)
    )
  );

alter table public.payment_schedules enable row level security;
drop policy if exists payment_schedules_all on public.payment_schedules;
create policy payment_schedules_all on public.payment_schedules for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

alter table public.payment_schedule_items enable row level security;
drop policy if exists payment_schedule_items_all on public.payment_schedule_items;
create policy payment_schedule_items_all on public.payment_schedule_items for all to authenticated
  using (
    exists (
      select 1 from public.payment_schedules s
      where s.id = schedule_id and public.ti_is_workspace_member(s.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.payment_schedules s
      where s.id = schedule_id and public.ti_is_workspace_member(s.owner_id)
    )
  );

alter table public.payment_events enable row level security;
drop policy if exists payment_events_select on public.payment_events;
create policy payment_events_select on public.payment_events for select to authenticated
  using (
    invoice_id is not null and exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.ti_is_workspace_member(i.owner_id)
    )
  );
-- inserts are service-role only (webhooks)

-- payroll tables
alter table public.payroll_runs enable row level security;
drop policy if exists payroll_runs_all on public.payroll_runs;
create policy payroll_runs_all on public.payroll_runs for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

alter table public.payroll_compensation enable row level security;
drop policy if exists payroll_compensation_all on public.payroll_compensation;
create policy payroll_compensation_all on public.payroll_compensation for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));

alter table public.referral_rewards enable row level security;
drop policy if exists referral_rewards_all on public.referral_rewards;
create policy referral_rewards_all on public.referral_rewards for all to authenticated
  using (public.ti_is_workspace_member(owner_id))
  with check (public.ti_is_workspace_member(owner_id));
