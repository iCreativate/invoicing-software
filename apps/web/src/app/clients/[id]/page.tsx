'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Banknote, Calendar, FileText, Wallet } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Card';
import { AppPageHero } from '@/components/layout/AppPageHero';
import { SectionHeader } from '@/components/ui/PageHeader';
import { routes } from '@/lib/routing/routes';
import {
  fetchClientDetail,
  fetchClientInvoiceInsights,
  fetchClientInvoicesForScore,
  fetchClientInvoicesList,
  fetchClientPayments,
  fetchClientQuotesList,
} from '@/features/clients/api';
import type { ClientDetail, ClientInvoiceInsights } from '@/features/clients/types';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/Skeleton';
import { computeTimelyPaymentScore, type TimelyPaymentScore } from '@/lib/clients/paymentScore';
import {
  clientDirectoryStatus,
  directoryStatusLabel,
  isInvoiceOverdue,
  type ClientDirectoryStatus,
} from '@/lib/clients/directory';
import { cn } from '@/lib/utils/cn';
import { InvoiceListStatusBadge } from '@/components/invoice/InvoiceListStatusBadge';
import type { InvoiceStatus } from '@/features/invoices/types';
import type { WorkspacePaymentListRow } from '@/features/payments/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { notifyError, notifySuccess } from '@/lib/notify';

type ClientTab = 'overview' | 'invoices' | 'quotes' | 'payments' | 'activity';

const TABS: { id: ClientTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'payments', label: 'Payments' },
  { id: 'activity', label: 'Activity' },
];

type ClientInvoiceRow = Awaited<ReturnType<typeof fetchClientInvoicesList>>[number];
type ClientQuoteRow = Awaited<ReturnType<typeof fetchClientQuotesList>>[number];

function statusVariant(status: ClientDirectoryStatus): 'danger' | 'warning' | 'success' | 'default' {
  if (status === 'overdue') return 'danger';
  if (status === 'outstanding') return 'warning';
  if (status === 'active') return 'success';
  return 'default';
}

function methodLabel(m: string) {
  if (m === 'bank_transfer') return 'EFT';
  return m
    .split('_')
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ClientViewPage() {
  const params = useParams();
  const id = String((params as { id?: string }).id);
  const { canEdit, canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;
  const allowRecord = capStatus === 'ready' && canRecordPayments;

  const [tab, setTab] = useState<ClientTab>('overview');
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [insights, setInsights] = useState<ClientInvoiceInsights | null>(null);
  const [score, setScore] = useState<TimelyPaymentScore | null>(null);
  const [invoices, setInvoices] = useState<ClientInvoiceRow[]>([]);
  const [quotes, setQuotes] = useState<ClientQuoteRow[]>([]);
  const [payments, setPayments] = useState<WorkspacePaymentListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, ins, invs, invList, quoteList, payList] = await Promise.all([
          fetchClientDetail(id),
          fetchClientInvoiceInsights(id),
          fetchClientInvoicesForScore(id),
          fetchClientInvoicesList(id),
          fetchClientQuotesList(id),
          fetchClientPayments(id).catch(() => [] as WorkspacePaymentListRow[]),
        ]);
        if (!alive) return;
        setClient(c);
        setInsights(ins);
        setScore(computeTimelyPaymentScore(invs));
        setInvoices(invList);
        setQuotes(quoteList);
        setPayments(payList);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load client.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const today = new Date().toISOString().slice(0, 10);
  const relationshipStatus = useMemo(() => {
    const overdueCount = invoices.filter((inv) =>
      isInvoiceOverdue(
        { status: inv.status, balance: inv.balance_amount, dueDate: inv.due_date },
        today
      )
    ).length;
    const outstanding = invoices.reduce((s, inv) => s + inv.balance_amount, 0);
    return clientDirectoryStatus({ invoiceCount: invoices.length, outstanding, overdueCount });
  }, [invoices, today]);

  const openInvoices = invoices.filter(
    (inv) => inv.balance_amount > 0 && inv.status !== 'cancelled' && inv.status !== 'draft'
  );
  const overdueInvoices = invoices.filter((inv) =>
    isInvoiceOverdue({ status: inv.status, balance: inv.balance_amount, dueDate: inv.due_date }, today)
  );
  const recordPaymentHref =
    openInvoices.length === 1
      ? `${routes.app.invoices}/${openInvoices[0]!.id}/payments`
      : routes.app.payments;

  const currency = invoices[0]?.currency ?? payments[0]?.currency ?? 'ZAR';
  const billed = insights?.lifetimeBilled ?? 0;
  const collected = insights?.lifetimeCollected ?? 0;
  const outstanding = insights?.outstanding ?? 0;
  const overdueAmount = insights?.overdueAmount ?? 0;
  const moneyMax = Math.max(1, billed, collected, outstanding);

  const activity = useMemo(() => {
    const items: { at: string; title: string; detail: string; href: string }[] = [];
    for (const inv of invoices) {
      items.push({
        at: inv.issue_date,
        title: 'Invoice issued',
        detail: `${inv.invoice_number || inv.id.slice(0, 8)} · ${formatMoney(inv.total_amount, inv.currency)}`,
        href: `${routes.app.invoices}/${inv.id}`,
      });
    }
    for (const q of quotes) {
      items.push({
        at: q.issue_date,
        title: 'Quote created',
        detail: `${q.quote_number || q.id.slice(0, 8)} · ${formatMoney(q.total_amount, q.currency)}`,
        href: `${routes.app.quotes}/${q.id}`,
      });
    }
    for (const p of payments) {
      items.push({
        at: p.payment_date,
        title: 'Payment received',
        detail: `${formatMoney(p.amount, p.currency)}${p.invoiceNumber ? ` · ${p.invoiceNumber}` : ''}`,
        href: `${routes.app.invoices}/${p.invoiceId}/payments`,
      });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }, [invoices, quotes, payments]);

  const sendReminder = async () => {
    if (!overdueInvoices.length) {
      notifyError('This client has no overdue invoices.');
      return;
    }
    setReminding(true);
    try {
      const res = await fetch('/api/invoices/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: overdueInvoices.map((inv) => inv.id) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Reminder failed');
      notifySuccess(
        overdueInvoices.length === 1
          ? 'Reminder sent.'
          : `Reminders sent for ${overdueInvoices.length} invoices.`
      );
    } catch (e: any) {
      notifyError(e?.message ?? 'Could not send reminder.');
    } finally {
      setReminding(false);
    }
  };

  return (
    <AppShell hideHeader title={client?.name ? client.name : 'Client'}>
      <div className="ti-page-enter flex min-h-0 w-full flex-1 flex-col gap-4">
        <div>
          <Link href={routes.app.clients} className="ti-meta hover:text-[var(--tl-ink)]">
            Clients
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        ) : client ? (
          <AppPageHero
            kicker="People"
            title={client.name}
            description={[client.email, client.phone, client.companyName].filter(Boolean).join(' · ') || 'No contact details yet.'}
            image="clients"
            imageAlt={client.name}
            compact
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(relationshipStatus)}>{directoryStatusLabel(relationshipStatus)}</Badge>
                {canMutate ? (
                  <>
                    <Button asChild size="sm">
                      <Link href={`${routes.app.invoices}/new?clientId=${id}`}>Create invoice</Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`${routes.app.quotes}/new?clientId=${id}`}>Create quote</Link>
                    </Button>
                  </>
                ) : null}
                {allowRecord ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={recordPaymentHref}>Record payment</Link>
                  </Button>
                ) : null}
                {canMutate ? (
                  <Button type="button" variant="secondary" size="sm" disabled={reminding} onClick={() => void sendReminder()}>
                    {reminding ? 'Sending…' : 'Send reminder'}
                  </Button>
                ) : null}
                {canMutate ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`${routes.app.clients}/${id}/edit`}>Edit details</Link>
                  </Button>
                ) : null}
              </div>
            }
          />
        ) : null}

        <nav aria-label="Client sections" className="ti-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
              className="ti-tab"
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error ? <div className="rounded-[var(--ti-radius)] border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

        {!loading && tab === 'overview' && insights ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Summary">
              {(
                [
                  {
                    label: 'Outstanding',
                    value: formatMoney(outstanding, currency),
                    trend: overdueAmount > 0 ? 'Includes overdue' : 'Open balance',
                    icon: Wallet,
                    trendDown: outstanding > 0 && overdueAmount > 0,
                  },
                  {
                    label: 'Paid',
                    value: formatMoney(collected, currency),
                    trend: 'Lifetime collected',
                    icon: Banknote,
                  },
                  {
                    label: 'Overdue',
                    value: formatMoney(overdueAmount, currency),
                    trend: `${insights.overdueCount} invoice${insights.overdueCount === 1 ? '' : 's'}`,
                    icon: AlertCircle,
                    trendDown: overdueAmount > 0,
                  },
                  {
                    label: 'Total billed',
                    value: formatMoney(billed, currency),
                    trend: 'Lifetime invoiced',
                    icon: FileText,
                  },
                  {
                    label: 'Last payment',
                    value: insights.lastPaidAt ?? '—',
                    trend: insights.lastPaidAt ? 'Most recent' : 'No payments recorded',
                    icon: Calendar,
                  },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="ti-stat-card">
                    <span className="ti-stat-icon" aria-hidden>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="ti-stat-label">{m.label}</span>
                    <span className={cn('ti-stat-value', 'trendDown' in m && m.trendDown && 'text-danger')}>{m.value}</span>
                    <span className={cn('ti-stat-meta', 'trendDown' in m && m.trendDown && 'ti-stat-meta-down')}>{m.trend}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Surface variant="elevated" className="ti-panel">
                <div className="ti-panel-head">
                  <SectionHeader kicker="Recent activity" />
                </div>
                {activity.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Invoices, quotes and payments will appear here.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {activity.slice(0, 6).map((row, i) => (
                      <li key={`${row.title}-${row.at}-${i}`}>
                        <Link href={row.href} className="flex items-start justify-between gap-3 py-3 hover:opacity-80">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{row.title}</div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.detail}</div>
                          </div>
                          <div className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{row.at.slice(0, 10)}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Surface>

              <Surface variant="elevated" className="ti-panel">
                <div className="ti-panel-head">
                  <SectionHeader
                    kicker="Financial relationship"
                    description="Billed, collected and still owed — without leaving this client."
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {(
                    [
                      ['Total billed', billed, false],
                      ['Paid', collected, false],
                      ['Outstanding', outstanding, false],
                      ['Overdue', overdueAmount, true],
                    ] as const
                  ).map(([label, amount, danger]) => (
                    <div key={label}>
                      <div className="flex items-baseline justify-between gap-2 text-[12px]">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={cn('tabular-nums font-medium', danger && amount > 0 && 'text-danger')}>
                          {formatMoney(amount, currency)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', danger ? 'bg-danger/80' : 'bg-primary/80')}
                          style={{ width: `${Math.min(100, (amount / moneyMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--ti-radius)] border border-border px-3 py-3">
                    <div className="text-[11px] text-muted-foreground">Avg days to pay</div>
                    <div className="mt-1 text-sm font-semibold tabular-nums">
                      {insights.avgDaysToPay != null ? `${insights.avgDaysToPay}d` : '—'}
                    </div>
                  </div>
                  <div className="rounded-[var(--ti-radius)] border border-border px-3 py-3">
                    <div className="text-[11px] text-muted-foreground">Collection rate</div>
                    <div className="mt-1 text-sm font-semibold tabular-nums">
                      {billed > 0 ? `${Math.round((collected / billed) * 100)}%` : '—'}
                    </div>
                  </div>
                </div>
                {score ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Payment score {score.score} · based on this client&apos;s invoice history.
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <button type="button" className="font-medium text-muted-foreground hover:text-foreground" onClick={() => setTab('invoices')}>
                    View invoices
                  </button>
                  <button type="button" className="font-medium text-muted-foreground hover:text-foreground" onClick={() => setTab('payments')}>
                    View payments
                  </button>
                </div>
              </Surface>
            </div>
          </>
        ) : null}

        {!loading && tab === 'invoices' ? (
          <Surface variant="elevated" className="ti-panel">
            <SectionHeader
              kicker="Invoices"
              actions={
                canMutate ? (
                  <Link href={`${routes.app.invoices}/new?clientId=${id}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Create invoice
                  </Link>
                ) : null
              }
            />
            {invoices.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No invoices for this client yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`${routes.app.invoices}/${inv.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:opacity-80"
                    >
                      <div>
                        <div className="text-sm font-semibold">{inv.invoice_number || inv.id.slice(0, 8)}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Issued {inv.issue_date} · Due {inv.due_date}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <InvoiceListStatusBadge
                          inv={{
                            id: inv.id,
                            invoice_number: inv.invoice_number,
                            status: inv.status as InvoiceStatus,
                            issue_date: inv.issue_date,
                            due_date: inv.due_date,
                            currency: inv.currency,
                            total_amount: inv.total_amount,
                            paid_amount: inv.paid_amount,
                            balance_amount: inv.balance_amount,
                            client_id: id,
                            client_name: client?.name ?? null,
                          }}
                        />
                        <span className="text-sm font-semibold tabular-nums">{formatMoney(inv.total_amount, inv.currency)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        ) : null}

        {!loading && tab === 'quotes' ? (
          <Surface variant="elevated" className="ti-panel">
            <SectionHeader
              kicker="Quotes"
              actions={
                canMutate ? (
                  <Link href={`${routes.app.quotes}/new?clientId=${id}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Create quote
                  </Link>
                ) : null
              }
            />
            {quotes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No quotes for this client yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`${routes.app.quotes}/${q.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:opacity-80"
                    >
                      <div>
                        <div className="text-sm font-semibold">{q.quote_number || q.id.slice(0, 8)}</div>
                        <div className="mt-0.5 text-xs capitalize text-muted-foreground">{q.status}</div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(q.total_amount, q.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        ) : null}

        {!loading && tab === 'payments' ? (
          <Surface variant="elevated" className="ti-panel">
            <SectionHeader
              kicker="Payments"
              actions={
                allowRecord ? (
                  <Link href={recordPaymentHref} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Record payment
                  </Link>
                ) : null
              }
            />
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No payments recorded for this client yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {payments.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${routes.app.invoices}/${p.invoiceId}/payments`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:opacity-80"
                    >
                      <div>
                        <div className="text-sm font-semibold">{formatMoney(p.amount, p.currency)}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {p.invoiceNumber ?? 'Invoice'} · {methodLabel(p.method)}
                        </div>
                      </div>
                      <div className="text-[11px] tabular-nums text-muted-foreground">{p.payment_date.slice(0, 10)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        ) : null}

        {!loading && tab === 'activity' ? (
          <Surface variant="elevated" className="ti-panel">
            <SectionHeader kicker="Activity" description="Invoices, quotes and payments for this client." />
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing has happened with this client yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {activity.map((row, i) => (
                  <li key={`${row.title}-${row.at}-${i}`}>
                    <Link href={row.href} className="flex items-start justify-between gap-3 py-3 hover:opacity-80">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{row.title}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.detail}</div>
                      </div>
                      <div className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{row.at.slice(0, 10)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        ) : null}
      </div>
    </AppShell>
  );
}
