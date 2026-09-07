'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  CreditCard,
  FileText,
  Landmark,
  Search,
  Smartphone,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Amount } from '@/components/ui/Text';
import { AdminAlertBanner } from '@/components/workspace/workspace-ui';
import type { PaymentMethod } from '@/features/payments/types';
import { formatMoney } from '@/lib/format/money';
import { PAYMENT_METHOD_OPTIONS, todayISO } from '@/lib/payments/labels';
import { cn } from '@/lib/utils/cn';

export type PaymentInvoiceOption = {
  id: string;
  invoice_number: string;
  client_name: string | null;
  currency: string;
  balance_amount: number;
  total_amount: number;
  paid_amount?: number;
  due_date?: string | null;
  status: string;
};

const METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  bank_transfer: Landmark,
  card: CreditCard,
  cash: Banknote,
  cheque: FileText,
  mobile_money: Smartphone,
  paystack: Zap,
  flutterwave: Zap,
};

function formatDue(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function InvoiceSummaryCard({ invoice }: { invoice: PaymentInvoiceOption }) {
  const paid = invoice.paid_amount ?? Math.max(0, invoice.total_amount - invoice.balance_amount);
  const pct = invoice.total_amount > 0 ? Math.min(100, Math.round((paid / invoice.total_amount) * 100)) : 0;
  const dueLabel = formatDue(invoice.due_date);
  const isOverdue =
    invoice.due_date && invoice.balance_amount > 0 && invoice.due_date < todayISO();

  return (
    <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Invoice</p>
          <p className="mt-1 text-[15px] font-semibold text-[var(--tl-ink)]">{invoice.invoice_number}</p>
          <p className="mt-0.5 truncate text-[13px] text-[var(--tl-ink-2)]">{invoice.client_name ?? 'No client'}</p>
          {dueLabel ? (
            <p className={cn('mt-2 text-[12px] font-medium', isOverdue ? 'text-[var(--tl-danger)]' : 'text-[var(--tl-ink-3)]')}>
              {isOverdue ? 'Overdue · ' : 'Due '}
              {dueLabel}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <Amount
            display
            className={cn(
              '!text-[clamp(1.1rem,2vw,1.35rem)] leading-tight',
              invoice.balance_amount > 0 ? 'text-[var(--tl-ink)]' : 'text-[var(--tl-success)]'
            )}
          >
            {formatMoney(invoice.balance_amount, invoice.currency)}
          </Amount>
          <p className="mt-1 ti-caption text-[var(--tl-ink-3)]">balance due</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--tl-line)_80%,white)]">
          <div
            className="h-full rounded-full bg-[var(--tl-success)] transition-[width] duration-[var(--ti-duration-md)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between gap-3 ti-caption text-[var(--tl-ink-3)]">
          <span>
            Paid {formatMoney(paid, invoice.currency)} ({pct}%)
          </span>
          <span>Total {formatMoney(invoice.total_amount, invoice.currency)}</span>
        </div>
      </div>
    </div>
  );
}

export function RecordPaymentForm({
  invoices,
  fixedInvoice,
  loadingInvoices = false,
  submitting = false,
  error,
  onSubmit,
  onCancel,
  compactMethods = false,
}: {
  invoices?: PaymentInvoiceOption[];
  fixedInvoice?: PaymentInvoiceOption;
  loadingInvoices?: boolean;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (data: {
    invoiceId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    paymentDate: string;
    notes: string | null;
  }) => Promise<void> | void;
  onCancel?: () => void;
  /** Show fewer method options (modal / quick record) */
  compactMethods?: boolean;
}) {
  const [invoiceId, setInvoiceId] = useState(fixedInvoice?.id ?? '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const openInvoices = useMemo(() => {
    const list = (invoices ?? []).filter((inv) => inv.balance_amount > 0 && inv.status !== 'cancelled');
    const today = todayISO();
    return [...list].sort((a, b) => {
      const aOver = a.due_date && a.due_date < today ? 1 : 0;
      const bOver = b.due_date && b.due_date < today ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      return b.balance_amount - a.balance_amount;
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    if (!q) return openInvoices;
    return openInvoices.filter((inv) => {
      const hay = `${inv.invoice_number} ${inv.client_name ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [openInvoices, invoiceSearch]);

  const selectedInvoice = useMemo(() => {
    if (fixedInvoice) return fixedInvoice;
    return openInvoices.find((i) => i.id === invoiceId) ?? invoices?.find((i) => i.id === invoiceId);
  }, [fixedInvoice, openInvoices, invoices, invoiceId]);

  useEffect(() => {
    if (fixedInvoice) {
      setInvoiceId(fixedInvoice.id);
      if (fixedInvoice.balance_amount > 0) setAmount(String(fixedInvoice.balance_amount));
      return;
    }
    if (!invoiceId && openInvoices[0]) {
      setInvoiceId(openInvoices[0].id);
      setAmount(String(openInvoices[0].balance_amount));
    }
  }, [fixedInvoice, openInvoices, invoiceId]);

  const methodOptions = compactMethods
    ? PAYMENT_METHOD_OPTIONS.filter((m) => ['bank_transfer', 'card', 'cash'].includes(m.value))
    : PAYMENT_METHOD_OPTIONS;

  const setQuickAmount = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setAmount(value.toFixed(2));
  };

  const onInvoicePick = (id: string) => {
    setInvoiceId(id);
    const inv = openInvoices.find((i) => i.id === id) ?? invoices?.find((i) => i.id === id);
    if (inv && inv.balance_amount > 0) setAmount(String(inv.balance_amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const id = fixedInvoice?.id ?? invoiceId;
    if (!id) {
      setLocalError('Choose an invoice to apply this payment to.');
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setLocalError('Enter a valid payment amount.');
      return;
    }
    if (selectedInvoice && amt > selectedInvoice.balance_amount + 0.01) {
      setLocalError(`Amount exceeds the invoice balance of ${formatMoney(selectedInvoice.balance_amount, selectedInvoice.currency)}.`);
      return;
    }
    const currency = selectedInvoice?.currency ?? 'ZAR';
    await onSubmit({
      invoiceId: id,
      amount: amt,
      currency,
      method,
      paymentDate,
      notes: notes.trim() || null,
    });
  };

  const displayError = error ?? localError;
  const balance = selectedInvoice?.balance_amount ?? 0;

  return (
    <form className="grid gap-5" onSubmit={(e) => void handleSubmit(e)}>
      {displayError ? (
        <AdminAlertBanner tone="error">{displayError}</AdminAlertBanner>
      ) : null}

      {!fixedInvoice ? (
        <div className="grid gap-4">
          {openInvoices.length > 4 ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tl-ink-3)]" />
              <Input
                type="search"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="Search open invoices…"
                className="pl-9"
                aria-label="Search invoices"
              />
            </div>
          ) : null}

          {openInvoices.length > 1 && openInvoices.length <= 6 ? (
            <div className="flex flex-wrap gap-2">
              {openInvoices.slice(0, 4).map((inv) => {
                const active = inv.id === invoiceId;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => onInvoicePick(inv.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-left text-[12px] font-medium transition-colors',
                      active
                        ? 'border-[color-mix(in_srgb,var(--tl-navy)_35%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-navy)_8%,white)] text-[var(--tl-ink)]'
                        : 'border-[var(--tl-line)] bg-[var(--tl-surface)] text-[var(--tl-ink-2)] hover:border-[color-mix(in_srgb,var(--tl-navy)_20%,var(--tl-line))]'
                    )}
                  >
                    <span className="block font-semibold">{inv.invoice_number}</span>
                    <span className="block text-[11px] opacity-80">
                      {formatMoney(inv.balance_amount, inv.currency)} due
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <Field label="Invoice" htmlFor="record-payment-invoice">
            <Select
              id="record-payment-invoice"
              value={invoiceId}
              onChange={(e) => onInvoicePick(e.target.value)}
              disabled={loadingInvoices}
            >
              {filteredInvoices.length === 0 ? (
                <option value="">{loadingInvoices ? 'Loading invoices…' : 'No open invoices'}</option>
              ) : (
                filteredInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number}
                    {inv.client_name ? ` — ${inv.client_name}` : ''} · {formatMoney(inv.balance_amount, inv.currency)} due
                  </option>
                ))
              )}
            </Select>
          </Field>
        </div>
      ) : null}

      {selectedInvoice ? <InvoiceSummaryCard invoice={selectedInvoice} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount received" htmlFor="record-payment-amount" hint={balance > 0 ? `Up to ${formatMoney(balance, selectedInvoice?.currency ?? 'ZAR')}` : undefined}>
          <Input
            id="record-payment-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="ti-amount text-[15px] font-semibold"
          />
          {balance > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="rounded-full border border-[var(--tl-line)] bg-[var(--tl-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tl-ink-2)] hover:border-[color-mix(in_srgb,var(--tl-navy)_25%,var(--tl-line))] hover:text-[var(--tl-ink)]"
                onClick={() => setQuickAmount(balance)}
              >
                Full balance
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--tl-line)] bg-[var(--tl-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tl-ink-2)] hover:border-[color-mix(in_srgb,var(--tl-navy)_25%,var(--tl-line))] hover:text-[var(--tl-ink)]"
                onClick={() => setQuickAmount(Math.round((balance / 2) * 100) / 100)}
              >
                Half
              </button>
            </div>
          ) : null}
        </Field>

        <Field label="Date received" htmlFor="record-payment-date">
          <Input
            id="record-payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            max={todayISO()}
          />
        </Field>
      </div>

      <Field label="Payment method" hint="How the customer paid you.">
        <div className={cn('grid gap-2', compactMethods ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
          {methodOptions.map((opt) => {
            const Icon = METHOD_ICONS[opt.value] ?? Building2;
            const active = method === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-[var(--tl-radius-sm)] border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-[color-mix(in_srgb,var(--tl-navy)_40%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-navy)_8%,white)] shadow-[var(--shadow-elevated)]'
                    : 'border-[var(--tl-line)] bg-[var(--tl-surface)] hover:border-[color-mix(in_srgb,var(--tl-navy)_20%,var(--tl-line))]'
                )}
                aria-pressed={active}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    active ? 'bg-[var(--tl-navy)] text-white' : 'bg-[var(--tl-bg)] text-[var(--tl-ink-2)]'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[13px] font-semibold text-[var(--tl-ink)]">{opt.label}</span>
                <span className="text-[11px] leading-snug text-[var(--tl-ink-3)]">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Reference or notes"
        htmlFor="record-payment-notes"
        hint="EFT reference, receipt number, or anything your accountant needs."
      >
        <Textarea
          id="record-payment-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. ABSA ref 482910 · paid by EFT"
          rows={2}
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--tl-line)] pt-4">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting} disabled={submitting || !selectedInvoice || balance <= 0}>
          {submitting ? 'Saving…' : 'Record payment'}
        </Button>
      </div>
    </form>
  );
}
