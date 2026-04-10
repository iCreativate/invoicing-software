'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import {
  createPaymentViaApi,
  fetchInvoicesForPaymentPicker,
  fetchPaymentsDashboard,
} from '@/features/payments/api';
import type { PaymentMethod, WorkspacePaymentListRow } from '@/features/payments/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

function methodLabel(m: string) {
  if (m === 'bank_transfer') return 'EFT';
  return m
    .split('_')
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

function providerLabel(p: string | null) {
  if (!p) return '—';
  const k = p.toLowerCase();
  if (k === 'payfast') return 'PayFast';
  if (k === 'stripe') return 'Stripe';
  if (k === 'yoco') return 'Yoco';
  if (k === 'snapscan') return 'SnapScan';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listMonth, setListMonth] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceOptions, setInvoiceOptions] = useState<Awaited<ReturnType<typeof fetchInvoicesForPaymentPicker>>>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [manualInvoiceId, setManualInvoiceId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState<PaymentMethod>('bank_transfer');
  const [manualDate, setManualDate] = useState(todayISO);
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { payments, analytics: a } = await fetchPaymentsDashboard({
      month: listMonth.trim() || undefined,
      limit: 200,
    });
    setItems(payments);
    setAnalytics(a);
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

  const totals = useMemo(() => {
    const completed = filtered.filter((p) => p.status === 'completed');
    const sum = completed.reduce((s, p) => s + p.amount, 0);
    const currency = completed[0]?.currency ?? 'ZAR';
    return { sum, currency, count: completed.length };
  }, [filtered]);

  const selectedInvoice = useMemo(
    () => invoiceOptions.find((i) => i.id === manualInvoiceId),
    [invoiceOptions, manualInvoiceId]
  );

  const openModal = async () => {
    if (!allowRecord) return;
    setModalOpen(true);
    setManualError(null);
    if (invoiceOptions.length) return;
    try {
      setLoadingInvoices(true);
      const list = await fetchInvoicesForPaymentPicker();
      setInvoiceOptions(list);
      if (!manualInvoiceId && list[0]) {
        setManualInvoiceId(list[0].id);
        const bal = list[0].balance_amount;
        if (bal > 0) setManualAmount(String(bal));
      }
    } catch (e: any) {
      setManualError(e?.message ?? 'Could not load invoices.');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const onInvoiceChange = (id: string) => {
    setManualInvoiceId(id);
    const inv = invoiceOptions.find((i) => i.id === id);
    if (inv && inv.balance_amount > 0) setManualAmount(String(inv.balance_amount));
  };

  const onManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    const amt = Number(manualAmount);
    if (!manualInvoiceId) {
      setManualError('Choose an invoice.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setManualError('Enter a valid amount.');
      return;
    }
    const currency = selectedInvoice?.currency ?? 'ZAR';
    try {
      setManualSubmitting(true);
      await createPaymentViaApi({
        invoiceId: manualInvoiceId,
        amount: amt,
        currency,
        method: manualMethod,
        paymentDate: manualDate,
        notes: manualNotes.trim() || null,
      });
      setModalOpen(false);
      setManualAmount('');
      setManualNotes('');
      await load();
    } catch (err: any) {
      setManualError(err?.message ?? 'Failed to save payment.');
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Payments"
      actions={
        <div className="flex flex-wrap gap-2">
          {allowRecord ? (
            <Button type="button" onClick={openModal}>
              Record payment
            </Button>
          ) : null}
          <Link href={routes.app.invoices}>
            <Button variant="secondary">Invoices</Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <div className="text-xs font-semibold text-muted-foreground">Monthly income (UTC)</div>
            <div className="mt-2 text-xl font-semibold tabular-nums">
              {analytics
                ? formatMoney(analytics.monthlyIncome, analytics.monthlyCurrency)
                : loading
                  ? '…'
                  : formatMoney(0, 'ZAR')}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {analytics?.month ? `Calendar month ${analytics.month}` : '—'}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-semibold text-muted-foreground">Avg. time to get paid</div>
            <div className="mt-2 text-xl font-semibold tabular-nums">
              {analytics?.avgDaysToFirstPayment != null ? `${analytics.avgDaysToFirstPayment} days` : '—'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              From invoice issue date to first completed payment (per invoice, then averaged).
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-semibold text-muted-foreground">Payment integrations</div>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">PayFast</span> — ITN webhook records payments with
                provider <code className="text-xs">payfast</code>; reconciles invoice totals automatically.
              </li>
              <li>
                <span className="font-semibold text-foreground">Stripe</span> — planned; will use{' '}
                <code className="text-xs">provider: stripe</code> and card method.
              </li>
              <li>
                <span className="font-semibold text-foreground">Yoco</span> — planned; same pattern for SA terminals.
              </li>
            </ul>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold">All payments</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${filtered.length} shown`}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
                Filter list by month
                <input
                  type="month"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  value={listMonth}
                  onChange={(e) => setListMonth(e.target.value)}
                />
              </label>
              <div className="min-w-0 flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search invoice, client, notes…"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">Completed (filtered view)</div>
              <div className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(totals.sum, totals.currency)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{totals.count} payment(s)</div>
            </div>
            <div className="rounded-2xl bg-muted/20 p-4 sm:col-span-2">
              <div className="text-xs font-semibold text-muted-foreground">Reconciliation</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Payments are stored on <span className="font-semibold text-foreground">payments</span> and invoice{' '}
                <span className="font-semibold text-foreground">paid_amount</span>,{' '}
                <span className="font-semibold text-foreground">balance_amount</span>, and{' '}
                <span className="font-semibold text-foreground">status</span> are recalculated from completed rows so
                totals stay accurate.
              </div>
            </div>
          </div>

          {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-muted-foreground dark:border-zinc-800">
              No payments in this view. Record a payment or widen the month filter.
              <div className="mt-3 flex flex-wrap gap-2">
                {allowRecord ? (
                  <Button type="button" onClick={openModal}>
                    Record payment
                  </Button>
                ) : null}
                <Link href={routes.app.invoices}>
                  <Button variant="secondary">Open invoices</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[960px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="border-b border-border px-3 py-2">Date</th>
                    <th className="border-b border-border px-3 py-2">Client</th>
                    <th className="border-b border-border px-3 py-2">Invoice</th>
                    <th className="border-b border-border px-3 py-2">Method</th>
                    <th className="border-b border-border px-3 py-2">Source</th>
                    <th className="border-b border-border px-3 py-2">Status</th>
                    <th className="border-b border-border px-3 py-2 text-right">Amount</th>
                    <th className="border-b border-border px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="text-sm">
                      <td className="border-b border-zinc-100 px-3 py-3 tabular-nums dark:border-zinc-900">
                        {p.payment_date || '—'}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        {p.clientName ?? '—'}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 font-semibold dark:border-zinc-900">
                        <Link className="hover:underline" href={`${routes.app.invoices}/${p.invoiceId}`}>
                          {p.invoiceNumber ?? 'View invoice'}
                        </Link>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">{methodLabel(p.method)}</td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-muted-foreground dark:border-zinc-900">
                        {providerLabel(p.provider)}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <Badge
                          variant={
                            p.status === 'completed' ? 'success' : p.status === 'failed' ? 'danger' : 'outline'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-right tabular-nums font-semibold dark:border-zinc-900">
                        {formatMoney(p.amount, p.currency)}
                      </td>
                      <td className="max-w-[200px] truncate border-b border-zinc-100 px-3 py-3 text-muted-foreground dark:border-zinc-900">
                        {p.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent aria-describedby={undefined}>
          <ModalHeader>
            <ModalTitle>Record payment</ModalTitle>
          </ModalHeader>
          <form className="mt-4 grid gap-3" onSubmit={onManualSubmit}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Invoice</span>
              <select
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={manualInvoiceId}
                onChange={(e) => onInvoiceChange(e.target.value)}
                disabled={loadingInvoices}
              >
                {invoiceOptions.length === 0 ? (
                  <option value="">{loadingInvoices ? 'Loading…' : 'No invoices'}</option>
                ) : (
                  invoiceOptions.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number}
                      {inv.client_name ? ` — ${inv.client_name}` : ''} ({inv.status}, bal{' '}
                      {formatMoney(inv.balance_amount, inv.currency)})
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Amount</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Method</span>
              <select
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value as PaymentMethod)}
              >
                <option value="bank_transfer">EFT</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Date received</span>
              <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} required />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Notes (optional)</span>
              <Input value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="EFT ref…" />
            </label>
            {manualError ? <div className="text-sm text-danger">{manualError}</div> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={manualSubmitting || !manualInvoiceId}>
                {manualSubmitting ? 'Saving…' : 'Save payment'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}
