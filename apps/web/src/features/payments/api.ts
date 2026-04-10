import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type {
  PaymentListItem,
  PaymentMethod,
  PaymentStatus,
  PaymentsAnalytics,
  WorkspacePaymentListRow,
} from './types';

function coerceMethod(v: unknown): PaymentMethod {
  const s = String(v ?? 'bank_transfer').toLowerCase();
  const allowed: PaymentMethod[] = [
    'bank_transfer',
    'card',
    'cash',
    'cheque',
    'mobile_money',
    'paystack',
    'flutterwave',
  ];
  return (allowed.includes(s as PaymentMethod) ? (s as PaymentMethod) : 'bank_transfer');
}

function coerceStatus(v: unknown): PaymentStatus {
  const s = String(v ?? 'completed').toLowerCase();
  const allowed: PaymentStatus[] = ['pending', 'processing', 'completed', 'failed', 'refunded'];
  return allowed.includes(s as PaymentStatus) ? (s as PaymentStatus) : 'completed';
}

function mapApiPayment(p: Record<string, unknown>): WorkspacePaymentListRow {
  return {
    id: String(p.id),
    invoiceId: String(p.invoice_id),
    invoiceNumber: p.invoice_number != null ? String(p.invoice_number) : null,
    clientName: p.client_name != null ? String(p.client_name) : null,
    issueDate: p.issue_date != null ? String(p.issue_date).slice(0, 10) : null,
    amount: Number(p.amount ?? 0),
    currency: String(p.currency ?? 'ZAR'),
    method: coerceMethod(p.method),
    status: coerceStatus(p.status),
    payment_date: String(p.payment_date ?? ''),
    notes: p.notes != null ? String(p.notes) : null,
    provider: p.provider != null ? String(p.provider) : null,
    externalReference: p.external_reference != null ? String(p.external_reference) : null,
  };
}

export async function fetchPaymentsDashboard(params?: {
  month?: string;
  limit?: number;
}): Promise<{ payments: WorkspacePaymentListRow[]; analytics: PaymentsAnalytics }> {
  const sp = new URLSearchParams();
  if (params?.month?.trim()) sp.set('month', params.month.trim());
  sp.set('limit', String(params?.limit ?? 200));
  const res = await fetch(`/api/payments?${sp.toString()}`, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to load payments.');
  }
  const payments = (json.payments ?? []).map((p: Record<string, unknown>) => mapApiPayment(p));
  const a = json.analytics ?? {};
  const analytics: PaymentsAnalytics = {
    month: String(a.month ?? ''),
    monthlyIncome: Number(a.monthlyIncome ?? 0),
    monthlyCurrency: String(a.monthlyCurrency ?? 'ZAR'),
    avgDaysToFirstPayment:
      a.avgDaysToFirstPayment == null ? null : Number(a.avgDaysToFirstPayment),
  };
  return { payments, analytics };
}

export async function createPaymentViaApi(input: {
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentDate: string;
  notes?: string | null;
}) {
  const res = await fetch('/api/payments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoice_id: input.invoiceId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      payment_date: input.paymentDate.slice(0, 10),
      notes: input.notes ?? null,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to record payment.');
  }
  return { id: String(json.payment_id) };
}

export async function fetchInvoicePayments(invoiceId: string): Promise<PaymentListItem[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('payments')
    .select('id,amount,currency,method,status,payment_date,notes')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: String(p.id),
    amount: Number(p.amount ?? 0),
    currency: String(p.currency ?? 'ZAR'),
    method: coerceMethod(p.method),
    status: coerceStatus(p.status),
    payment_date: String(p.payment_date ?? ''),
    notes: p.notes ? String(p.notes) : null,
  }));
}

export async function recordPayment(input: {
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentDate: string;
  notes?: string;
}) {
  return createPaymentViaApi({
    invoiceId: input.invoiceId,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    paymentDate: input.paymentDate,
    notes: input.notes ?? null,
  });
}

export async function fetchInvoicesForPaymentPicker(): Promise<
  {
    id: string;
    invoice_number: string;
    client_name: string | null;
    currency: string;
    balance_amount: number;
    total_amount: number;
    status: string;
  }[]
> {
  const res = await fetch('/api/invoices', { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to load invoices.');
  }
  const list = json.data?.invoices ?? [];
  return list.map((row: any) => ({
    id: String(row.id),
    invoice_number: String(row.invoice_number ?? ''),
    client_name: row.client_name != null ? String(row.client_name) : null,
    currency: String(row.currency ?? 'ZAR'),
    balance_amount: Number(row.balance_amount ?? 0),
    total_amount: Number(row.total_amount ?? 0),
    status: String(row.status ?? 'draft'),
  }));
}

export async function fetchPaymentsList(params?: {
  query?: string;
  limit?: number;
}): Promise<WorkspacePaymentListRow[]> {
  const { payments } = await fetchPaymentsDashboard({ limit: params?.limit ?? 50 });
  return filterPaymentsByQuery(payments, params?.query);
}

function filterPaymentsByQuery(payments: WorkspacePaymentListRow[], query?: string) {
  const q = query?.trim().toLowerCase();
  if (!q) return payments;
  return payments.filter((p) => {
    const hay = `${p.invoiceNumber ?? ''} ${p.clientName ?? ''} ${p.method} ${p.notes ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}
