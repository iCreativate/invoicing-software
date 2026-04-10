import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import type { InvoiceListItem, InvoiceStatus } from './types';

function coerceStatus(status: unknown): InvoiceStatus {
  const s = String(status ?? 'draft').toLowerCase();
  if (s === 'paid' || s === 'partial' || s === 'sent' || s === 'overdue' || s === 'cancelled' || s === 'draft') {
    return s;
  }
  return 'draft';
}

export async function fetchInvoicesList(): Promise<InvoiceListItem[]> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();

  let query = supabase
    .from('invoices')
    .select(
      `
      id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      total_amount,
      paid_amount,
      balance_amount,
      client_id,
      client:clients(name)
    `
    )
    .eq('owner_id', workspaceOwnerId)
    .order('created_at', { ascending: false });

  let { data, error } = await query;

  if (error) {
    const msg = String((error as any).message ?? '').toLowerCase();
    if (msg.includes('owner_id') || msg.includes('column')) {
      ({ data, error } = await supabase
        .from('invoices')
        .select(
          `
      id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      total_amount,
      paid_amount,
      balance_amount,
      client_id,
      client:clients(name)
    `
        )
        .order('created_at', { ascending: false }));
    }
  }

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    invoice_number: String(row.invoice_number ?? ''),
    status: coerceStatus(row.status),
    issue_date: String(row.issue_date ?? ''),
    due_date: String(row.due_date ?? ''),
    currency: String(row.currency ?? 'ZAR'),
    total_amount: Number(row.total_amount ?? 0),
    paid_amount: Number(row.paid_amount ?? 0),
    balance_amount: Number(row.balance_amount ?? 0),
    client_name: row.client?.name ?? null,
    client_id: row.client_id ? String(row.client_id) : undefined,
  }));
}

