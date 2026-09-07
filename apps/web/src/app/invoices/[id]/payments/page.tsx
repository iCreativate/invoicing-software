'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Banknote, CheckCircle2, Receipt, Wallet } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero } from '@/components/layout/AppPageHero';
import { PageSummary } from '@/components/layout/PageLayout';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { RecordPaymentForm } from '@/components/payments/RecordPaymentForm';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Amount } from '@/components/ui/Text';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchInvoiceDetail, type InvoiceDetail } from '@/features/invoices/detailApi';
import { fetchInvoicePayments, recordPayment } from '@/features/payments/api';
import type { PaymentListItem } from '@/features/payments/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { formatPaymentDate, methodLabel } from '@/lib/payments/labels';
import { notifyError, notifySuccess } from '@/lib/notify';
import { cn } from '@/lib/utils/cn';

function paymentStatusClass(status: string) {
  if (status === 'completed') return 'ti-status-paid';
  if (status === 'failed') return 'ti-status-overdue';
  return 'ti-status-sent';
}

export default function InvoicePaymentsPage() {
  const params = useParams();
  const invoiceId = String((params as any).id);
  const { canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const allowRecord = capStatus === 'ready' && canRecordPayments;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    const [inv, list] = await Promise.all([fetchInvoiceDetail(invoiceId), fetchInvoicePayments(invoiceId)]);
    setInvoice(inv);
    setPayments(list);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const currency = invoice?.currency ?? 'ZAR';
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const paidPct =
    invoice && invoice.total_amount > 0
      ? Math.min(100, Math.round((invoice.paid_amount / invoice.total_amount) * 100))
      : 0;

  const fixedInvoice = invoice
    ? {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client?.name ?? null,
        currency: invoice.currency,
        balance_amount: invoice.balance_amount,
        total_amount: invoice.total_amount,
        paid_amount: invoice.paid_amount,
        due_date: invoice.due_date,
        status: invoice.status,
      }
    : undefined;

  const onSubmit = async (data: {
    invoiceId: string;
    amount: number;
    currency: string;
    method: Parameters<typeof recordPayment>[0]['method'];
    paymentDate: string;
    notes: string | null;
  }) => {
    setFormError(null);
    try {
      setSubmitting(true);
      await recordPayment({
        ...data,
        notes: data.notes ?? undefined,
      });
      await load();
      notifySuccess('Payment recorded.');
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to record payment.';
      setFormError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell hideHeader title="Payments">
      <div className="ti-page-enter flex w-full flex-col gap-4 md:gap-5">
        <AppPageHero
          kicker="Invoice"
          title={invoice?.invoice_number ? `Payments · ${invoice.invoice_number}` : 'Payments'}
          description="Record payments and track what’s been collected on this invoice."
          image="payments"
          compact
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href={`${routes.app.invoices}/${invoiceId}`}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Back to invoice
              </Link>
            </Button>
          }
        />

        {error ? (
          <AdminAlertBanner tone="error">
            <div className="font-medium">Couldn&apos;t load invoice payments</div>
            <p className="mt-1">{error}</p>
          </AdminAlertBanner>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-[var(--tl-radius-sm)]" />
            <Skeleton className="h-64 w-full rounded-[var(--tl-radius-sm)]" />
          </div>
        ) : (
          <>
            <PageSummary>
              <MoneyKpiGrid cols={4} aria-label="Invoice payment summary">
                <MoneyKpiCard
                  icon={Receipt}
                  label="Invoice total"
                  value={formatMoney(invoice?.total_amount ?? 0, currency)}
                  trend={invoice?.client?.name ?? '—'}
                />
                <MoneyKpiCard
                  icon={CheckCircle2}
                  label="Collected"
                  value={formatMoney(totalPaid, currency)}
                  trend={`${paidPct}% of invoice`}
                  trendUp={totalPaid > 0}
                />
                <MoneyKpiCard
                  icon={Wallet}
                  label="Balance due"
                  value={formatMoney(invoice?.balance_amount ?? 0, currency)}
                  trend={invoice?.balance_amount === 0 ? 'Fully paid' : 'Outstanding'}
                  trendDown={(invoice?.balance_amount ?? 0) > 0}
                />
                <MoneyKpiCard
                  icon={Banknote}
                  label="Payments"
                  value={String(payments.length)}
                  trend={payments.length === 1 ? '1 recorded' : `${payments.length} recorded`}
                />
              </MoneyKpiGrid>
            </PageSummary>

            <div className="grid min-h-0 w-full flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-5">
              <AdminPanel
                kicker="History"
                title={`${payments.length} payment${payments.length === 1 ? '' : 's'}`}
                description="All payments recorded against this invoice."
                className="min-h-0"
              >
                {payments.length === 0 ? (
                  <EmptyState
                    kicker="No payments yet"
                    title="Nothing recorded on this invoice."
                    description="Use the form to log the first payment — partial payments are supported."
                  />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {payments.map((p) => (
                        <div key={p.id} className="ti-invoice-card" data-tone="paid">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Amount className="ti-invoice-amount">{formatMoney(p.amount, p.currency)}</Amount>
                              <div className="ti-invoice-meta mt-1">
                                {formatPaymentDate(p.payment_date)} · {methodLabel(p.method)}
                              </div>
                            </div>
                            <span className={cn('ti-status capitalize', paymentStatusClass(p.status))}>{p.status}</span>
                          </div>
                          {p.notes ? <p className="mt-2 text-[13px] text-[var(--tl-ink-2)]">{p.notes}</p> : null}
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((p) => (
                            <TableRow key={p.id} data-tone="paid">
                              <TableCell>
                                <div className="ti-invoice-due">{formatPaymentDate(p.payment_date)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="ti-invoice-meta">{methodLabel(p.method)}</div>
                              </TableCell>
                              <TableCell>
                                <span className={cn('ti-status capitalize', paymentStatusClass(p.status))}>
                                  {p.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Amount className="ti-invoice-amount text-right">{formatMoney(p.amount, p.currency)}</Amount>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[14rem] truncate ti-invoice-meta">{p.notes ?? '—'}</div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </AdminPanel>

              <AdminPanel
                kicker="Record"
                title="New payment"
                description={
                  allowRecord
                    ? 'Log EFT, card, cash, or other methods. Balances update immediately.'
                    : 'Recording payments requires editor or billing access.'
                }
                className="lg:sticky lg:top-4 lg:self-start"
              >
                {!allowRecord ? (
                  <AdminAlertBanner tone="info">
                    Viewers are read-only. Ask an owner or admin to change your role under Team.
                  </AdminAlertBanner>
                ) : fixedInvoice && fixedInvoice.balance_amount <= 0 ? (
                  <AdminAlertBanner tone="success">
                    This invoice is fully paid. No further payments are needed.
                  </AdminAlertBanner>
                ) : (
                  <RecordPaymentForm
                    fixedInvoice={fixedInvoice}
                    submitting={submitting}
                    error={formError}
                    onSubmit={onSubmit}
                  />
                )}
              </AdminPanel>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
