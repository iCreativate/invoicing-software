'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  Clock,
  ListOrdered,
  Mail,
  MessageCircle,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { PageSummary } from '@/components/layout/PageLayout';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Amount } from '@/components/ui/Text';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { fetchInvoicesList } from '@/features/invoices/api';
import type { InvoiceListItem } from '@/features/invoices/types';
import { fetchClientsList } from '@/features/clients/api';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { demoCollectionsConfig } from '@/lib/demo/fixtures';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { todayInJohannesburg } from '@/lib/collections/schedule';
import {
  channelLabel,
  computeAgingBuckets,
  computeCollectionMetrics,
  enrichCollectionInvoices,
  filterCollectionView,
  offsetLabel,
  templateLabel,
  topClientsByOverdue,
  type CollectionStep,
  type CollectionView,
  type EnrichedCollectionInvoice,
} from '@/lib/collections/workspace';
import { cn } from '@/lib/utils/cn';

const DEFAULT_STEPS: CollectionStep[] = [
  { id: 'd1', offsetDays: -3, channel: 'email', templateKey: 'before_due' },
  { id: 'd2', offsetDays: 0, channel: 'email', templateKey: 'due' },
  { id: 'd3', offsetDays: 3, channel: 'email', templateKey: 'overdue_3' },
  { id: 'd4', offsetDays: 7, channel: 'email', templateKey: 'overdue_7' },
];

function formatDue(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'whatsapp') {
    return <MessageCircle className="h-3.5 w-3.5" aria-hidden />;
  }
  return <Mail className="h-3.5 w-3.5" aria-hidden />;
}

function AgingBar({
  label,
  count,
  amount,
  maxAmount,
  currency,
}: {
  label: string;
  count: number;
  amount: number;
  maxAmount: number;
  currency: string;
}) {
  const pct = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[var(--tl-ink)]">{label}</span>
        <span className="ti-caption text-[var(--tl-ink-3)]">
          {count} invoice{count === 1 ? '' : 's'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--tl-bg)]">
        <div
          className="h-full rounded-full bg-[color-mix(in_srgb,var(--tl-danger)_75%,var(--tl-accent))] transition-[width] duration-[var(--ti-duration-md)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Amount className="text-[14px] font-semibold text-[var(--tl-ink)]">{formatMoney(amount, currency)}</Amount>
    </div>
  );
}

export function CollectionsPageClient() {
  const { canEdit, canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;
  const [rows, setRows] = useState<InvoiceListItem[]>([]);
  const [clients, setClients] = useState<{ id: string; email: string | null; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [steps, setSteps] = useState<CollectionStep[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<CollectionView>('overdue');
  const [search, setSearch] = useState('');
  const todayISO = todayInJohannesburg();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isDemoUiActive()) {
          const cfg = demoCollectionsConfig();
          if (!cancelled) {
            setRows(await fetchInvoicesList());
            setClients(await fetchClientsList());
            setAutomationEnabled(Boolean(cfg.automationEnabled));
            setSteps(cfg.steps);
          }
          return;
        }
        const [list, cfgRes, clientList] = await Promise.all([
          fetchInvoicesList(),
          fetch('/api/collections/config', { credentials: 'include' }),
          fetchClientsList(),
        ]);
        if (!cancelled) {
          setRows(list);
          setClients(clientList);
        }
        const cfg = await cfgRes.json().catch(() => null);
        if (!cancelled && cfg?.success) {
          setAutomationEnabled(Boolean(cfg.data?.automationEnabled));
          setSteps(Array.isArray(cfg.data?.steps) ? cfg.data.steps : []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load collections');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enriched = useMemo(() => enrichCollectionInvoices(rows, todayISO), [rows, todayISO]);
  const metrics = useMemo(() => computeCollectionMetrics(enriched, todayISO), [enriched, todayISO]);
  const overdueAll = useMemo(
    () => filterCollectionView(enriched, 'overdue', todayISO),
    [enriched, todayISO]
  );
  const agingBuckets = useMemo(() => computeAgingBuckets(overdueAll), [overdueAll]);
  const topClients = useMemo(() => topClientsByOverdue(overdueAll), [overdueAll]);
  const displaySteps = steps.length > 0 ? steps : DEFAULT_STEPS;

  const filtered = useMemo(() => {
    const base = filterCollectionView(enriched, view, todayISO);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((inv) => {
      const num = (inv.invoice_number || inv.id.slice(0, 8)).toLowerCase();
      const client = (inv.client_name ?? '').toLowerCase();
      return num.includes(q) || client.includes(q);
    });
  }, [enriched, view, todayISO, search]);

  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulkRemind = async (invoiceIds: string[]) => {
    if (!invoiceIds.length) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/invoices/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Bulk remind failed');
      const detail = json.data.errors?.length ? ` Skipped: ${json.data.errors.join('; ')}` : '';
      notifySuccess(`Sent ${json.data.sent} reminder(s).${detail}`);
      setSelected(new Set());
    } catch (e: any) {
      notifyError(e?.message ?? 'Bulk remind failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const sendReminder = async (inv: InvoiceListItem) => {
    setBusyId(inv.id);
    try {
      const res = await fetch('/api/invoices/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: [inv.id] }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Reminder failed');
      notifySuccess('Reminder sent.');
    } catch (e: any) {
      notifyError(e?.message ?? 'Could not send reminder.');
    } finally {
      setBusyId(null);
    }
  };

  const viewDescription: Record<CollectionView, string> = {
    overdue: 'Invoices past due that still have a balance.',
    due_soon: 'Open invoices due within the next 7 days.',
    outstanding: 'All open invoices with an outstanding balance.',
  };

  const maxAgingAmount = Math.max(...agingBuckets.map((b) => b.amount), 1);

  const renderDueCell = (inv: EnrichedCollectionInvoice) => {
    if (view === 'due_soon') {
      return (
        <div className="ti-invoice-due">
          Due in {inv.daysUntilDue}d · {formatDue(inv.due_date)}
        </div>
      );
    }
    if (view === 'outstanding' && inv.due_date && inv.due_date >= todayISO) {
      return (
        <div className="ti-invoice-due">
          Due in {inv.daysUntilDue}d · {formatDue(inv.due_date)}
        </div>
      );
    }
    if (inv.daysOverdue > 0) {
      return (
        <div className="ti-invoice-due">
          {inv.daysOverdue}d overdue · due {formatDue(inv.due_date)}
        </div>
      );
    }
    return <div className="ti-invoice-due">Due {formatDue(inv.due_date)}</div>;
  };

  const renderActions = (inv: EnrichedCollectionInvoice) => {
    const client = clients.find((c) => c.id === inv.client_id);
    return (
      <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-medium">
        {canMutate ? (
          <button
            type="button"
            className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)] disabled:opacity-50"
            disabled={busyId === inv.id || bulkBusy}
            onClick={() => void sendReminder(inv)}
          >
            {busyId === inv.id ? 'Sending…' : 'Remind'}
          </button>
        ) : null}
        <Link href={`${routes.app.invoices}/${inv.id}`} className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]">
          View
        </Link>
        {canRecordPayments ? (
          <Link
            href={`${routes.app.invoices}/${inv.id}/payments`}
            className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
          >
            Record payment
          </Link>
        ) : null}
        {inv.client_id ? (
          client?.email ? (
            <a href={`mailto:${client.email}`} className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]">
              Contact
            </a>
          ) : (
            <Link
              href={`${routes.app.clients}/${inv.client_id}`}
              className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
            >
              Contact
            </Link>
          )
        ) : null}
      </div>
    );
  };

  return (
    <MoneyWorkspace
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canMutate && metrics.overdueCount > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              loading={bulkBusy}
              onClick={() => void runBulkRemind(overdueAll.map((i) => i.id))}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Remind all overdue
            </Button>
          ) : null}
          {capStatus === 'ready' && canRecordPayments ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={routes.app.payments}>Record payment</Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <MoneyKpiGrid cols={5} aria-label="Collections metrics">
            <MoneyKpiCard
              icon={AlertCircle}
              label="Overdue"
              value={loading ? '—' : formatMoney(metrics.overdueTotal, metrics.currency)}
              trend={`${metrics.overdueCount} invoice${metrics.overdueCount === 1 ? '' : 's'}`}
              trendDown={metrics.overdueTotal > 0}
              active={view === 'overdue'}
              onClick={() => setView('overdue')}
            />
            <MoneyKpiCard
              icon={CalendarClock}
              label="Due soon"
              value={loading ? '—' : formatMoney(metrics.dueSoonTotal, metrics.currency)}
              trend={`${metrics.dueSoonCount} in next 7 days`}
              active={view === 'due_soon'}
              onClick={() => setView('due_soon')}
            />
            <MoneyKpiCard
              icon={Banknote}
              label="Outstanding"
              value={loading ? '—' : formatMoney(metrics.outstandingTotal, metrics.currency)}
              trend={`${metrics.outstandingCount} open`}
              active={view === 'outstanding'}
              onClick={() => setView('outstanding')}
            />
            <MoneyKpiCard
              icon={Clock}
              label="Avg days overdue"
              value={loading ? '—' : metrics.avgDaysOverdue > 0 ? `${metrics.avgDaysOverdue}d` : '—'}
              trend={metrics.overdueCount > 0 ? 'Across overdue invoices' : 'No overdue invoices'}
              trendDown={metrics.avgDaysOverdue > 14}
            />
            <MoneyKpiCard
              icon={ListOrdered}
              label="Automation"
              value={automationEnabled ? 'Active' : 'Manual'}
              trend={displaySteps.map((s) => offsetLabel(s.offsetDays)).join(' · ')}
              href={!automationEnabled ? routes.app.settingsBilling : undefined}
            />
          </MoneyKpiGrid>
        </PageSummary>

        {error ? (
          <AdminAlertBanner tone="error">
            <div className="font-medium">Couldn&apos;t load collections</div>
            <p className="mt-1">{error}</p>
          </AdminAlertBanner>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-5">
          <AdminPanel
            kicker="Work queue"
            title={
              view === 'overdue'
                ? `${metrics.overdueCount} overdue`
                : view === 'due_soon'
                  ? `${metrics.dueSoonCount} due soon`
                  : `${metrics.outstandingCount} outstanding`
            }
            description={viewDescription[view]}
            className="flex min-h-0 flex-col"
            bodyClassName="mt-5 flex min-h-0 flex-1 flex-col"
            actions={
              canMutate && selected.size > 0 ? (
                <Button size="sm" variant="secondary" loading={bulkBusy} onClick={() => void runBulkRemind([...selected])}>
                  Remind selected ({selected.size})
                </Button>
              ) : null
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                items={[
                  { value: 'overdue', label: 'Overdue', badge: metrics.overdueCount || undefined },
                  { value: 'due_soon', label: 'Due soon', badge: metrics.dueSoonCount || undefined },
                  { value: 'outstanding', label: 'All outstanding', badge: metrics.outstandingCount || undefined },
                ]}
                value={view}
                onChange={(v) => {
                  setView(v as CollectionView);
                  setSelected(new Set());
                }}
              />
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tl-ink-3)]" />
                <Input
                  type="search"
                  placeholder="Search invoice or client…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search collections queue"
                />
              </div>
            </div>

            {loading ? (
              <div className="mt-6 space-y-0" aria-busy="true" aria-label="Loading collections queue">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40 flex-1" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && !error && filtered.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  kicker={search ? 'No matches' : 'All clear'}
                  title={search ? 'No invoices match your search.' : 'Nothing in this queue right now.'}
                  description={
                    search
                      ? 'Try a different invoice number or client name.'
                      : view === 'overdue'
                        ? 'When invoices pass their due date with a balance, they appear here.'
                        : 'Open invoices will show up here as they approach or pass their due date.'
                  }
                  action={
                    <Button asChild variant="secondary">
                      <Link href={routes.app.invoices}>Open invoices</Link>
                    </Button>
                  }
                />
              </div>
            ) : null}

            {filtered.length > 0 ? (
              <>
                <div className="mt-5 space-y-3 md:hidden">
                  {filtered.map((inv) => {
                    const tone = inv.daysOverdue > 0 ? 'overdue' : undefined;
                    return (
                      <div key={inv.id} className="ti-invoice-card" data-tone={tone}>
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex min-w-0 items-start gap-2.5">
                            {canMutate ? (
                              <input
                                type="checkbox"
                                checked={selected.has(inv.id)}
                                onChange={() => toggleRow(inv.id)}
                                className="mt-1 rounded border-border"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <Link
                                href={`${routes.app.invoices}/${inv.id}`}
                                className="ti-invoice-number hover:underline"
                              >
                                {inv.invoice_number || inv.id.slice(0, 8)}
                              </Link>
                              <div className="ti-invoice-client mt-1">{inv.client_name ?? '—'}</div>
                              <div className="ti-invoice-meta">{renderDueCell(inv)}</div>
                            </div>
                          </label>
                          {inv.daysOverdue > 0 ? (
                            <span className="ti-status ti-status-overdue">{inv.daysOverdue}d</span>
                          ) : null}
                        </div>
                        <div
                          className={cn(
                            'ti-invoice-amount',
                            inv.daysOverdue > 0 && 'text-[var(--tl-danger)]'
                          )}
                        >
                          {formatMoney(inv.balance_amount, inv.currency)}
                        </div>
                        <div className="border-t border-[var(--tl-line)] pt-3">{renderActions(inv)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 hidden min-h-0 flex-1 overflow-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        {canMutate ? (
                          <TableHead className="w-10">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleAll}
                              aria-label="Select all in queue"
                              className="rounded border-border"
                            />
                          </TableHead>
                        ) : null}
                        <TableHead>Invoice</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="w-48 text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((inv) => (
                        <TableRow key={inv.id} data-tone={inv.daysOverdue > 0 ? 'overdue' : undefined}>
                          {canMutate ? (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selected.has(inv.id)}
                                onChange={() => toggleRow(inv.id)}
                                aria-label={`Select ${inv.invoice_number || inv.id}`}
                                className="rounded border-border"
                              />
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <Link
                              href={`${routes.app.invoices}/${inv.id}`}
                              className="ti-invoice-number hover:underline"
                            >
                              {inv.invoice_number || inv.id.slice(0, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="ti-invoice-client">{inv.client_name ?? '—'}</div>
                          </TableCell>
                          <TableCell>{renderDueCell(inv)}</TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                'ti-invoice-amount text-right',
                                inv.daysOverdue > 0 && 'text-[var(--tl-danger)]'
                              )}
                            >
                              {formatMoney(inv.balance_amount, inv.currency)}
                            </div>
                          </TableCell>
                          <TableCell>{renderActions(inv)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </AdminPanel>

          <div className="flex flex-col gap-4 lg:gap-5">
            <AdminPanel kicker="Aging" title="Overdue breakdown" description="Outstanding balance by days past due.">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
                  ))}
                </div>
              ) : metrics.overdueCount === 0 ? (
                <p className="ti-caption text-[var(--tl-ink-3)]">No overdue invoices to analyse.</p>
              ) : (
                <div className="space-y-5">
                  {agingBuckets.map((bucket) => (
                    <AgingBar
                      key={bucket.key}
                      label={bucket.label}
                      count={bucket.count}
                      amount={bucket.amount}
                      maxAmount={maxAgingAmount}
                      currency={metrics.currency}
                    />
                  ))}
                </div>
              )}
            </AdminPanel>

            <AdminPanel
              kicker="Automation"
              title="Collection sequence"
              description={
                automationEnabled
                  ? 'Automated reminders run on this schedule.'
                  : 'Upgrade to Pro to automate your collection sequence.'
              }
              actions={
                !automationEnabled ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={routes.app.settingsBilling}>Open billing</Link>
                  </Button>
                ) : null
              }
            >
              <ol className="space-y-3">
                {displaySteps.map((step, index) => (
                  <li
                    key={step.id}
                    className="flex gap-3 rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-3.5 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--tl-surface)] text-[11px] font-bold text-[var(--tl-ink-2)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--tl-ink)]">
                          {offsetLabel(step.offsetDays)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tl-line)] bg-[var(--tl-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--tl-ink-2)]">
                          <ChannelIcon channel={step.channel} />
                          {channelLabel(step.channel)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-[var(--tl-ink-3)]">{templateLabel(step.templateKey)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </AdminPanel>

            <AdminPanel
              kicker="Clients"
              title="Top overdue accounts"
              description="Clients with the highest overdue balance."
            >
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-[var(--tl-radius-sm)]" />
                  ))}
                </div>
              ) : topClients.length === 0 ? (
                <p className="ti-caption text-[var(--tl-ink-3)]">No overdue client balances.</p>
              ) : (
                <ul className="space-y-2">
                  {topClients.map((row) => (
                    <li key={row.clientId}>
                      <Link
                        href={`${routes.app.clients}/${row.clientId}`}
                        className="flex items-center justify-between gap-3 rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-3.5 py-3 transition-colors hover:border-[color-mix(in_srgb,var(--tl-accent)_25%,var(--tl-line))]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                            <span className="truncate text-[13px] font-semibold text-[var(--tl-ink)]">
                              {row.clientName}
                            </span>
                          </div>
                          <p className="mt-1 ti-caption text-[var(--tl-ink-3)]">
                            {row.invoiceCount} invoice{row.invoiceCount === 1 ? '' : 's'} · up to {row.maxDaysOverdue}d
                            overdue
                          </p>
                        </div>
                        <Amount className="shrink-0 text-[14px] font-semibold text-[var(--tl-danger)]">
                          {formatMoney(row.amount, metrics.currency)}
                        </Amount>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>
          </div>
        </div>
      </div>
    </MoneyWorkspace>
  );
}
