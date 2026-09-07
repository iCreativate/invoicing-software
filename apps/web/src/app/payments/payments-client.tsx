'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Banknote, Clock3, Search, Wallet } from 'lucide-react';
import { MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { PageSummary } from '@/components/layout/PageLayout';
import { RecordPaymentForm } from '@/components/payments/RecordPaymentForm';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Amount } from '@/components/ui/Text';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import {
  createPaymentViaApi,
  fetchInvoicesForPaymentPicker,
  fetchPaymentsDashboard,
} from '@/features/payments/api';
import type { WorkspacePaymentListRow } from '@/features/payments/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { notifyError, notifySuccess } from '@/lib/notify';
import { fetchInvoicesList } from '@/features/invoices/api';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { formatPaymentDate, methodLabel, providerLabel } from '@/lib/payments/labels';
import { cn } from '@/lib/utils/cn';

function paymentTone(status: string): 'paid' | 'overdue' | 'open' {
  if (status === 'completed') return 'paid';
  if (status === 'failed') return 'overdue';
  return 'open';
}

function paymentStatusClass(status: string) {
  if (status === 'completed') return 'ti-status-paid';
  if (status === 'failed') return 'ti-status-overdue';
  return 'ti-status-sent';
}

export default function PaymentsClient() {
  const { canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const allowRecord = capStatus === 'ready' && canRecordPayments;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WorkspacePaymentListRow[]>([]);
  const [analytics, setAnalytics] = useState<{
    month: string;
    monthlyIncome: number;
    monthlyCurrency: string;
    avgDaysToFirstPayment: number | null;
  } | null>(null);
  const [moneyStats, setMoneyStats] = useState<{
    outstanding: number;
    overdue: number;
    overdueCount: number;
    currency: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listMonth, setListMonth] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceOptions, setInvoiceOptions] = useState<Awaited<ReturnType<typeof fetchInvoicesForPaymentPicker>>>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { payments, analytics: a } = await fetchPaymentsDashboard({
      month: listMonth.trim() || undefined,
      limit: 200,
    });
    setItems(payments);
    setAnalytics(a);
    try {
      const [invoices, summaryRes] = await Promise.all([
        fetchInvoicesList(),
        fetch('/api/dashboard/summary', { credentials: 'include' }),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const overdueRows = invoices.filter(
        (inv) => inv.status !== 'cancelled' && inv.balance_amount > 0 && inv.due_date && inv.due_date < today
      );
      const json = await summaryRes.json().catch(() => null);
      const summary = json?.success ? (json.data as DashboardSummary) : null;
      setMoneyStats({
        outstanding: summary?.overview.outstandingAmount ?? invoices.reduce((s, i) => s + i.balance_amount, 0),
        overdue: summary?.overview.overdueAmount ?? overdueRows.reduce((s, i) => s + i.balance_amount, 0),
        overdueCount: summary?.overview.overdueInvoiceCount ?? overdueRows.length,
        currency: summary?.currency ?? a.monthlyCurrency,
      });
    } catch {
      // keep payments list even if stats fail
    }
  }, [listMonth]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load payments.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const hay = `${p.invoiceNumber ?? ''} ${p.clientName ?? ''} ${p.method} ${p.notes ?? ''} ${p.provider ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const openModal = async () => {
    if (!allowRecord) return;
    setModalOpen(true);
    setManualError(null);
    if (invoiceOptions.length) return;
    try {
      setLoadingInvoices(true);
      const list = await fetchInvoicesForPaymentPicker();
      setInvoiceOptions(list);
    } catch (e: any) {
      const msg = e?.message ?? 'Could not load invoices.';
      setManualError(msg);
      notifyError(msg);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const onManualSubmit = async (data: {
    invoiceId: string;
    amount: number;
    currency: string;
    method: Parameters<typeof createPaymentViaApi>[0]['method'];
    paymentDate: string;
    notes: string | null;
  }) => {
    setManualError(null);
    try {
      setManualSubmitting(true);
      await createPaymentViaApi(data);
      setModalOpen(false);
      await load();
      notifySuccess('Payment recorded.');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save payment.';
      setManualError(msg);
      notifyError(msg);
    } finally {
      setManualSubmitting(false);
    }
  };

  const currency = analytics?.monthlyCurrency ?? moneyStats?.currency ?? 'ZAR';

  return (
    <MoneyWorkspace
      actions={
        allowRecord ? (
          <Button type="button" size="sm" onClick={openModal}>
            Record payment
          </Button>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <MoneyKpiGrid aria-label="Payment metrics">
            <MoneyKpiCard
              icon={Banknote}
              label="Money received"
              value={
                analytics
                  ? formatMoney(analytics.monthlyIncome, analytics.monthlyCurrency)
                  : loading
                    ? '—'
                    : formatMoney(0, currency)
              }
              trend="This month"
              trendUp
            />
            <MoneyKpiCard
              icon={Wallet}
              label="Outstanding"
              value={moneyStats ? formatMoney(moneyStats.outstanding, moneyStats.currency) : '—'}
              trend="Open balances"
            />
            <MoneyKpiCard
              icon={AlertCircle}
              label="Overdue"
              value={moneyStats ? formatMoney(moneyStats.overdue, moneyStats.currency) : '—'}
              trend={`${moneyStats?.overdueCount ?? 0} invoices`}
              trendDown={(moneyStats?.overdue ?? 0) > 0}
              href={routes.app.collections}
            />
            <MoneyKpiCard
              icon={Clock3}
              label="Days to paid"
              value={analytics?.avgDaysToFirstPayment != null ? `${analytics.avgDaysToFirstPayment}d` : '—'}
              trend="Avg first payment"
            />
          </MoneyKpiGrid>
        </PageSummary>

        <AdminPanel
          kicker="Ledger"
          title={`${filtered.length} payment${filtered.length === 1 ? '' : 's'}`}
          description={listMonth ? `Showing ${listMonth}` : 'Recent payments in this workspace.'}
          className="flex min-h-0 flex-1 flex-col"
          bodyClassName="mt-5 flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--tl-ink-3)]">
              <span className="sr-only">Month</span>
              <input
                type="month"
                className="h-9 rounded-[var(--ti-radius-sm)] border border-border bg-card px-3 text-sm text-foreground"
                value={listMonth}
                onChange={(e) => setListMonth(e.target.value)}
                aria-label="Filter by month"
              />
            </label>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tl-ink-3)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search invoice, client…"
                className="pl-9"
                aria-label="Search payments"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4">
              <AdminAlertBanner tone="error">
                <div className="font-medium">Couldn&apos;t load payments</div>
                <p className="mt-1">{error}</p>
              </AdminAlertBanner>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 space-y-0" aria-busy="true" aria-label="Loading payments">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={items.length === 0 ? 'No payments' : 'No matches'}
                title={items.length === 0 ? 'Record your first payment.' : 'No payments match this view.'}
                description={
                  items.length === 0
                    ? 'Log a payment against an invoice, or widen the month filter.'
                    : 'Try a different month or search term.'
                }
                action={
                  <div className="flex flex-wrap gap-2">
                    {allowRecord ? (
                      <Button type="button" onClick={openModal}>
                        Record payment
                      </Button>
                    ) : null}
                    <Button asChild variant="secondary">
                      <Link href={routes.app.invoices}>Open invoices</Link>
                    </Button>
                  </div>
                }
              />
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-5 space-y-3 md:hidden">
                {filtered.map((p) => {
                  const tone = paymentTone(p.status);
                  return (
                    <div key={p.id} className="ti-invoice-card" data-tone={tone}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`${routes.app.invoices}/${p.invoiceId}`}
                            className="ti-invoice-number hover:underline"
                          >
                            {p.invoiceNumber ?? 'View invoice'}
                          </Link>
                          <div className="ti-invoice-client mt-1">{p.clientName ?? '—'}</div>
                          <div className="ti-invoice-meta">
                            {formatPaymentDate(p.payment_date)} · {methodLabel(p.method)}
                            {p.provider ? ` · ${providerLabel(p.provider)}` : ''}
                          </div>
                        </div>
                        <span className={cn('ti-status capitalize', paymentStatusClass(p.status))}>{p.status}</span>
                      </div>
                      <Amount className="ti-invoice-amount">{formatMoney(p.amount, p.currency)}</Amount>
                      {p.notes ? <div className="ti-invoice-meta truncate">{p.notes}</div> : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} data-tone={paymentTone(p.status)}>
                        <TableCell>
                          <div className="ti-invoice-due">{formatPaymentDate(p.payment_date)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="ti-invoice-client">{p.clientName ?? '—'}</div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`${routes.app.invoices}/${p.invoiceId}`}
                            className="ti-invoice-number hover:underline"
                          >
                            {p.invoiceNumber ?? 'View invoice'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="ti-invoice-meta">{methodLabel(p.method)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="ti-invoice-meta">{providerLabel(p.provider)}</div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('ti-status capitalize', paymentStatusClass(p.status))}>{p.status}</span>
                        </TableCell>
                        <TableCell>
                          <Amount className="ti-invoice-amount">{formatMoney(p.amount, p.currency)}</Amount>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[12rem] truncate ti-invoice-meta">{p.notes ?? '—'}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </AdminPanel>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-2xl p-6 sm:p-7" aria-describedby="record-payment-desc">
          <ModalHeader>
            <ModalTitle className="ti-h3 text-[var(--tl-ink)]">Record payment</ModalTitle>
            <ModalDescription id="record-payment-desc" className="text-[13px] text-[var(--tl-ink-3)]">
              Apply a payment to an open invoice. The invoice balance and status update automatically.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-5">
            <RecordPaymentForm
              invoices={invoiceOptions}
              loadingInvoices={loadingInvoices}
              submitting={manualSubmitting}
              error={manualError}
              compactMethods
              onCancel={() => setModalOpen(false)}
              onSubmit={onManualSubmit}
            />
          </div>
        </ModalContent>
      </Modal>
    </MoneyWorkspace>
  );
}
