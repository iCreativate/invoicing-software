import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import type { PaymentListItem, PaymentMethod, PaymentStatus } from './types';

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
  const supabase = createSupabaseBrowserClient();

  const { data: paymentRow, error: payErr } = await supabase
    .from('payments')
    .insert({
      invoice_id: input.invoiceId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      status: 'completed',
      payment_date: input.paymentDate,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();

  if (payErr) throw payErr;

  // Update invoice aggregates (best-effort; you can replace this with a DB trigger later)
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id,total_amount,paid_amount,balance_amount,status')
    .eq('id', input.invoiceId)
    .single();
  if (invErr) throw invErr;

  const total = Number((invoice as any).total_amount ?? 0);
  const paid = Number((invoice as any).paid_amount ?? 0) + input.amount;
  const balance = Math.max(0, total - paid);
  const status = balance <= 0 ? 'paid' : 'partial';

  const { error: updErr } = await supabase
    .from('invoices')
    .update({
      paid_amount: paid,
      balance_amount: balance,
      status,
      paid_date: balance <= 0 ? input.paymentDate : null,
    })
    .eq('id', input.invoiceId);
  if (updErr) throw updErr;

  return { id: String((paymentRow as any).id) };
}

export async function fetchPaymentsList(params?: {
  query?: string;
  limit?: number;
}): Promise<
  (PaymentListItem & { invoiceId: string; invoiceNumber: string | null; clientName: string | null })[]
> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();
  const q = params?.query?.trim() ?? '';
  const limit = params?.limit ?? 50;

  // Pull invoice + client context for display (scoped to workspace invoices)
  let req = supabase
    .from('payments')
    .select(
      'id,invoice_id,amount,currency,method,status,payment_date,notes,invoices!inner(invoice_number,owner_id,clients(name))'
    )
    .eq('invoices.owner_id', workspaceOwnerId)
    .order('payment_date', { ascending: false })
    .limit(limit);

  // Basic filter (notes/method) in SQL; invoice/client search is handled client-side after fetch
  if (q) {
    req = req.or(`notes.ilike.%${q}%,method.ilike.%${q}%`);
  }

  const { data, error } = await req;
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    id: String(p.id),
    invoiceId: String(p.invoice_id),
    invoiceNumber: p?.invoices?.invoice_number ? String(p.invoices.invoice_number) : null,
    clientName: p?.invoices?.clients?.name ? String(p.invoices.clients.name) : null,
    amount: Number(p.amount ?? 0),
    currency: String(p.currency ?? 'ZAR'),
    method: coerceMethod(p.method),
    status: coerceStatus(p.status),
    payment_date: String(p.payment_date ?? ''),
    notes: p.notes ? String(p.notes) : null,
  }));
}

