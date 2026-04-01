import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { InvoiceStatus } from './types';

export type InvoiceDetail = {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  client: { id: string; name: string; email: string | null } | null;
};

function coerceStatus(status: unknown): InvoiceStatus {
  const s = String(status ?? 'draft').toLowerCase();
  if (s === 'paid' || s === 'partial' || s === 'sent' || s === 'overdue' || s === 'cancelled' || s === 'draft') {
    return s;
  }
  return 'draft';
}

export async function fetchInvoiceDetail(id: string): Promise<InvoiceDetail> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      subtotal_amount,
      tax_amount,
      total_amount,
      paid_amount,
      balance_amount,
      client:clients(id,name,email)
    `
    )
    .eq('id', id)
    .single();
  if (error) throw error;

  return {
    id: String((data as any).id),
    invoice_number: String((data as any).invoice_number ?? ''),
    status: coerceStatus((data as any).status),
    issue_date: String((data as any).issue_date ?? ''),
    due_date: String((data as any).due_date ?? ''),
    currency: String((data as any).currency ?? 'ZAR'),
    subtotal_amount: Number((data as any).subtotal_amount ?? 0),
    tax_amount: Number((data as any).tax_amount ?? 0),
    total_amount: Number((data as any).total_amount ?? 0),
    paid_amount: Number((data as any).paid_amount ?? 0),
    balance_amount: Number((data as any).balance_amount ?? 0),
    client: (data as any).client
      ? {
          id: String((data as any).client.id),
          name: String((data as any).client.name ?? ''),
          email: (data as any).client.email ? String((data as any).client.email) : null,
        }
      : null,
  };
}

