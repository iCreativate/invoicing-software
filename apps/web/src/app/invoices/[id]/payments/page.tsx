'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchInvoiceDetail, type InvoiceDetail } from '@/features/invoices/detailApi';
import { fetchInvoicePayments, recordPayment } from '@/features/payments/api';
import type { PaymentListItem, PaymentMethod } from '@/features/payments/types';

const PaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be > 0'),
  method: z.enum(['bank_transfer', 'card', 'cash', 'cheque', 'mobile_money', 'paystack', 'flutterwave']),
  paymentDate: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function methodLabel(m: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    bank_transfer: 'Bank transfer',
    card: 'Card',
    cash: 'Cash',
    cheque: 'Cheque',
    mobile_money: 'Mobile money',
    paystack: 'Paystack',
    flutterwave: 'Flutterwave',
  };
  return map[m] ?? 'Bank transfer';
}

export default function InvoicePaymentsPage() {
  const params = useParams();
  const invoiceId = String((params as any).id);

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<z.infer<typeof PaymentSchema>>({
    amount: 0,
    method: 'bank_transfer',
    paymentDate: todayISO(),
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);
    try {
      const parsed = PaymentSchema.safeParse(form);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          next[issue.path.join('.')] = issue.message;
        }
        setFormErrors(next);
        return;
      }

      if (!invoice) throw new Error('Invoice not loaded');

      await recordPayment({
        invoiceId,
        amount: parsed.data.amount,
        currency: invoice.currency,
        method: parsed.data.method as PaymentMethod,
        paymentDate: parsed.data.paymentDate,
        notes: parsed.data.notes,
      });

      setForm((f) => ({ ...f, amount: 0, notes: '' }));
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Payments"
      actions={
        <div className="flex items-center gap-2">
          <Link href={`${routes.app.invoices}/${invoiceId}`}>
            <Button variant="secondary">Back to invoice</Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-4">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">
                    {invoice?.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Invoice'}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Total paid (from payments): <span className="font-semibold">{formatMoney(totalPaid, currency)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    No payments recorded yet.
                  </div>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold">{formatMoney(p.amount, p.currency)}</div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                            {p.payment_date || '—'} · {methodLabel(p.method)} · {p.status}
                          </div>
                          {p.notes ? <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">{p.notes}</div> : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold">Record payment</div>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="amount">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              />
              {formErrors.amount ? <div className="text-xs text-red-700">{formErrors.amount}</div> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="method">
                Method
              </label>
              <select
                id="method"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as any }))}
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_money">Mobile money</option>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
              </select>
              {formErrors.method ? <div className="text-xs text-red-700">{formErrors.method}</div> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="paymentDate">
                Payment date
              </label>
              <Input
                id="paymentDate"
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
              />
              {formErrors.paymentDate ? <div className="text-xs text-red-700">{formErrors.paymentDate}</div> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="notes">
                Notes (optional)
              </label>
              <Input id="notes" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>

            <Button type="submit" disabled={submitting || loading}>
              {submitting ? 'Saving…' : 'Record payment'}
            </Button>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              This expects Supabase tables: `payments` and invoice columns `paid_amount`, `balance_amount`, `paid_date`.
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

