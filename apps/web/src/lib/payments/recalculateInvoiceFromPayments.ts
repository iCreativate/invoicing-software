import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Recompute invoice paid_amount, balance_amount, status, and paid_date from completed payments.
 * Use after any insert/update/delete on payments for an invoice.
 */
export async function recalculateInvoiceFromPayments(supabase: SupabaseClient, invoiceId: string) {
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('id,total_amount,status,issue_date,due_date,sent_at')
    .eq('id', invoiceId)
    .single();

  if (invErr || !inv) throw invErr ?? new Error('Invoice not found');

  const { data: payRows, error: payErr } = await supabase
    .from('payments')
    .select('amount,payment_date')
    .eq('invoice_id', invoiceId)
    .eq('status', 'completed');

  if (payErr) throw payErr;

  const rows = (payRows ?? []) as { amount: number | string; payment_date: string }[];
  const paid = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const total = Number((inv as any).total_amount ?? 0);
  const balance = Math.max(0, total - paid);

  const prevStatus = String((inv as any).status ?? 'draft');

  let status = prevStatus;
  if (balance <= 0 && total > 0) {
    status = 'paid';
  } else if (paid > 0 && balance > 0) {
    status = 'partial';
  } else if (paid === 0 && balance === total && (prevStatus === 'paid' || prevStatus === 'partial')) {
    status = (inv as any).sent_at ? 'sent' : 'draft';
  }

  let paid_date: string | null = null;
  if (balance <= 0 && total > 0 && rows.length > 0) {
    const chrono = [...rows].sort((a, b) => String(a.payment_date).localeCompare(String(b.payment_date)));
    let cum = 0;
    for (const p of chrono) {
      cum += Number(p.amount ?? 0);
      if (cum >= total) {
        paid_date = String(p.payment_date).slice(0, 10);
        break;
      }
    }
    if (!paid_date) paid_date = String(chrono[chrono.length - 1].payment_date).slice(0, 10);
  }

  const { error: updErr } = await supabase
    .from('invoices')
    .update({
      paid_amount: paid,
      balance_amount: balance,
      status,
      paid_date,
    })
    .eq('id', invoiceId);

  if (updErr) throw updErr;
}

export type InsertWorkspacePaymentInput = {
  invoiceId: string;
  amount: number;
  currency: string;
  method: string;
  paymentDate: string;
  notes?: string | null;
  status?: string;
  provider?: string | null;
  externalReference?: string | null;
};

export async function insertPaymentRow(
  supabase: SupabaseClient,
  input: InsertWorkspacePaymentInput
): Promise<{ id: string }> {
  const status = input.status ?? 'completed';
  const base = {
    invoice_id: input.invoiceId,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    status,
    payment_date: input.paymentDate.slice(0, 10),
    notes: input.notes ?? null,
  };
  const withMeta =
    input.provider != null || input.externalReference != null
      ? {
          ...base,
          provider: input.provider ?? null,
          external_reference: input.externalReference ?? null,
        }
      : base;

  let { data: row, error } = await supabase.from('payments').insert(withMeta).select('id').single();

  if (error) {
    const msg = String((error as any).message ?? '').toLowerCase();
    if (msg.includes('provider') || msg.includes('external_reference') || msg.includes('column')) {
      const fb = await supabase.from('payments').insert(base).select('id').single();
      row = fb.data;
      error = fb.error;
    }
  }

  if (error) throw error;
  return { id: String((row as any).id) };
}

/** Insert payment (if not skipped) and reconcile invoice when status is completed. */
export async function insertPaymentAndReconcile(supabase: SupabaseClient, input: InsertWorkspacePaymentInput) {
  const { id } = await insertPaymentRow(supabase, input);
  const st = input.status ?? 'completed';
  if (st === 'completed') {
    await recalculateInvoiceFromPayments(supabase, input.invoiceId);
  }
  return { paymentId: id };
}
