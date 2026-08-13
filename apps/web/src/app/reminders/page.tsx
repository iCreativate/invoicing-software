'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { fetchInvoicesList } from '@/features/invoices/api';
import type { InvoiceListItem } from '@/features/invoices/types';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { demoCollectionsConfig } from '@/lib/demo/fixtures';

function daysOverdue(dueDate: string, todayISO: string) {
  const a = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  const b = new Date(`${todayISO}T00:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function offsetLabel(offsetDays: number) {
  if (offsetDays < 0) return `T${offsetDays}`;
  if (offsetDays === 0) return 'T+0';
  return `T+${offsetDays}`;
}

export default function CollectionsPage() {
  const [rows, setRows] = useState<InvoiceListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [steps, setSteps] = useState<{ id: string; offsetDays: number; channel: string; templateKey: string }[]>([]);
  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isDemoUiActive()) {
          const cfg = demoCollectionsConfig();
          if (!cancelled) {
            setRows(await fetchInvoicesList());
            setAutomationEnabled(Boolean(cfg.automationEnabled));
            setSteps(cfg.steps);
          }
          return;
        }
        const [list, cfgRes] = await Promise.all([
          fetchInvoicesList(),
          fetch('/api/collections/config', { credentials: 'include' }),
        ]);
        if (!cancelled) setRows(list);
        const cfg = await cfgRes.json().catch(() => null);
        if (!cancelled && cfg?.success) {
          setAutomationEnabled(Boolean(cfg.data?.automationEnabled));
          setSteps(Array.isArray(cfg.data?.steps) ? cfg.data.steps : []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load invoices');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const overdue = useMemo(
    () =>
      rows
        .filter((inv) => inv.status !== 'cancelled' && inv.balance_amount > 0 && inv.due_date && inv.due_date < todayISO)
        .map((inv) => ({ ...inv, days: daysOverdue(inv.due_date, todayISO) }))
        .sort((a, b) => b.days - a.days || b.balance_amount - a.balance_amount),
    [rows, todayISO]
  );

  const displaySteps =
    steps.length > 0
      ? steps
      : [
          { id: 'd1', offsetDays: -3, channel: 'email', templateKey: 'before_due' },
          { id: 'd2', offsetDays: 0, channel: 'email', templateKey: 'due' },
          { id: 'd3', offsetDays: 3, channel: 'email', templateKey: 'overdue_3' },
          { id: 'd4', offsetDays: 7, channel: 'email', templateKey: 'overdue_7' },
        ];

  return (
    <AppShell title="Collections">
      <PageBody>
        <PageHeader
          title="Collections"
          description="Overdue invoices and automated reminder sequence for your workspace."
        />

        <GlassCard className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Automation</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {automationEnabled
                  ? 'Active for Pro/Business — daily cron sends email steps (−3 / due / +3 / +7) without duplicates.'
                  : 'Available on Pro/Business. Upgrade under Billing to enable automated sequences.'}
              </p>
            </div>
            <span
              className={
                automationEnabled
                  ? 'rounded-md bg-success/10 px-2.5 py-1 text-xs font-semibold text-success'
                  : 'rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'
              }
            >
              {automationEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {displaySteps.map((s) => (
              <li key={s.id} className="rounded-[var(--ti-radius-sm)] border border-border bg-muted/30 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {offsetLabel(s.offsetDays)}
                </div>
                <div className="mt-1 text-sm font-medium capitalize text-foreground">
                  {s.templateKey.replaceAll('_', ' ') || 'Reminder'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.channel}</p>
              </li>
            ))}
          </ol>
          {!automationEnabled ? (
            <p className="mt-4 text-xs text-muted-foreground">
              <Link href={routes.app.billing} className="font-medium text-foreground underline-offset-4 hover:underline">
                Open Billing
              </Link>{' '}
              to upgrade.
            </p>
          ) : null}
        </GlassCard>

        <GlassCard className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold">Overdue</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : `${overdue.length} invoice${overdue.length === 1 ? '' : 's'} past due`}
            </p>
          </div>
          {error ? <p className="px-4 py-6 text-sm text-danger sm:px-5">{error}</p> : null}
          {!loading && !error && overdue.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">No overdue balances right now.</p>
          ) : null}
          {overdue.length > 0 ? (
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-auto">
              {overdue.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`${routes.app.invoices}/${inv.id}`}
                    className="flex flex-col gap-2 px-4 py-3.5 transition-colors duration-150 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">
                        {inv.invoice_number || inv.id.slice(0, 8)} · {inv.client_name ?? 'Client'}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Due {inv.due_date} · {inv.days} day{inv.days === 1 ? '' : 's'} overdue
                      </div>
                    </div>
                    <div className="ti-num font-semibold text-danger">
                      {formatMoney(inv.balance_amount, inv.currency)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </GlassCard>
      </PageBody>
    </AppShell>
  );
}
