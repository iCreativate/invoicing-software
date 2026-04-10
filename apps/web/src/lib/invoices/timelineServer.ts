import type { SupabaseClient } from '@supabase/supabase-js';

export type InvoiceTimelineEventType = 'created' | 'sent' | 'viewed' | 'paid' | 'updated' | 'reminder_sent';

export type InvoiceTimelineEntry = {
  type: InvoiceTimelineEventType | string;
  at: string;
  meta?: Record<string, unknown>;
  source: 'db' | 'synthetic';
};

export async function logInvoiceTimelineEvent(
  supabase: SupabaseClient,
  invoiceId: string,
  eventType: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('invoice_timeline_events').insert({
    invoice_id: invoiceId,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    meta: meta ?? {},
  });
  if (error) {
    const m = String(error.message ?? '').toLowerCase();
    if (m.includes('relation') || m.includes('does not exist') || m.includes('schema cache')) return;
    throw error;
  }
}

export async function fetchInvoiceTimelineRows(supabase: SupabaseClient, invoiceId: string) {
  const { data, error } = await supabase
    .from('invoice_timeline_events')
    .select('id, event_type, occurred_at, meta')
    .eq('invoice_id', invoiceId)
    .order('occurred_at', { ascending: true });
  if (error) {
    const m = String(error.message ?? '').toLowerCase();
    if (m.includes('relation') || m.includes('does not exist')) return [];
    throw error;
  }
  return (data ?? []).map((r: any) => ({
    type: String(r.event_type),
    at: String(r.occurred_at),
    meta: (r.meta && typeof r.meta === 'object' ? r.meta : {}) as Record<string, unknown>,
    source: 'db' as const,
  }));
}

/** Merge DB timeline with invoice row timestamps so older workspaces still show a sensible story. */
export function mergeInvoiceTimeline(
  invoice: {
    created_at?: string | null;
    sent_at?: string | null;
    paid_date?: string | null;
    status?: string | null;
    total_amount?: number;
    paid_amount?: number;
    balance_amount?: number;
  },
  dbEntries: InvoiceTimelineEntry[]
): InvoiceTimelineEntry[] {
  const has = (t: string) => dbEntries.some((e) => e.type === t);
  const synthetic: InvoiceTimelineEntry[] = [];

  const createdAt = invoice.created_at ? String(invoice.created_at) : null;
  if (createdAt && !has('created')) {
    synthetic.push({ type: 'created', at: createdAt, source: 'synthetic' });
  }

  const sentAt = invoice.sent_at ? String(invoice.sent_at) : null;
  if (sentAt && !has('sent')) {
    synthetic.push({ type: 'sent', at: sentAt, source: 'synthetic' });
  }

  const paidDate = invoice.paid_date ? String(invoice.paid_date) : null;
  const status = String(invoice.status ?? '').toLowerCase();
  const bal = Number(invoice.balance_amount ?? 0);
  const paidOk = status === 'paid' || (Number(invoice.paid_amount ?? 0) > 0 && bal <= 0);
  if (paidDate && paidOk && !has('paid')) {
    synthetic.push({ type: 'paid', at: `${paidDate}T12:00:00.000Z`, source: 'synthetic' });
  }

  const merged = [...dbEntries, ...synthetic];
  merged.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return merged;
}
