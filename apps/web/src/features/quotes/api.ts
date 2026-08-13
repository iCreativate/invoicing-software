import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { demoQuoteDetail, demoQuotesList, demoReadOnlyError } from '@/lib/demo/fixtures';
import type { QuoteDetail, QuoteListItem } from './types';

function makeQuoteNumber() {
  const y = String(new Date().getFullYear());
  const n = Math.floor(10000 + Math.random() * 90000);
  return `QT-${y}-${n}`;
}

function newShareId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function fetchQuotesList(): Promise<QuoteListItem[]> {
  if (isDemoUiActive()) return demoQuotesList();
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('quotes')
    .select(
      'id,quote_number,status,issue_date,valid_until,currency,total_amount,converted_invoice_id,client:clients(name)'
    )
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    quoteNumber: r.quote_number ? String(r.quote_number) : null,
    status: String(r.status ?? 'draft'),
    issueDate: String(r.issue_date ?? ''),
    validUntil: String(r.valid_until ?? ''),
    currency: String(r.currency ?? 'ZAR'),
    totalAmount: Number(r.total_amount ?? 0),
    clientName: r.client?.name ? String(r.client.name) : null,
    convertedInvoiceId: r.converted_invoice_id ? String(r.converted_invoice_id) : null,
  }));
}

export async function fetchQuoteDetail(id: string): Promise<QuoteDetail | null> {
  if (isDemoUiActive()) return demoQuoteDetail(id);
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data: q, error } = await supabase
    .from('quotes')
    .select(
      'id,quote_number,status,issue_date,valid_until,currency,vat_rate,subtotal_amount,tax_amount,total_amount,notes,client_id,converted_invoice_id,public_share_id,viewed_at,accepted_at,declined_at'
    )
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!q) return null;

  const { data: items, error: itemErr } = await supabase
    .from('quote_items')
    .select('id,description,quantity,unit_price,tax_rate,line_total')
    .eq('quote_id', id)
    .order('created_at', { ascending: true });
  if (itemErr) throw itemErr;

  return {
    id: String((q as any).id),
    quoteNumber: (q as any).quote_number ? String((q as any).quote_number) : null,
    status: String((q as any).status ?? 'draft'),
    issueDate: String((q as any).issue_date ?? ''),
    validUntil: String((q as any).valid_until ?? ''),
    currency: String((q as any).currency ?? 'ZAR'),
    vatRate: Number((q as any).vat_rate ?? 15),
    subtotalAmount: Number((q as any).subtotal_amount ?? 0),
    taxAmount: Number((q as any).tax_amount ?? 0),
    totalAmount: Number((q as any).total_amount ?? 0),
    notes: (q as any).notes != null ? String((q as any).notes) : null,
    clientId: String((q as any).client_id),
    convertedInvoiceId: (q as any).converted_invoice_id ? String((q as any).converted_invoice_id) : null,
    publicShareId: (q as any).public_share_id ? String((q as any).public_share_id) : null,
    viewedAt: (q as any).viewed_at ? String((q as any).viewed_at) : null,
    acceptedAt: (q as any).accepted_at ? String((q as any).accepted_at) : null,
    declinedAt: (q as any).declined_at ? String((q as any).declined_at) : null,
    items: (items ?? []).map((it: any) => ({
      id: String(it.id),
      description: String(it.description ?? ''),
      quantity: Number(it.quantity ?? 0),
      unitPrice: Number(it.unit_price ?? 0),
      vatRate: Number(it.tax_rate ?? 15),
      lineTotal: Number(it.line_total ?? 0),
    })),
  };
}

export async function createQuote(input: {
  clientId: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  vatRate: number;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
}): Promise<{ id: string }> {
  if (isDemoUiActive()) throw demoReadOnlyError();
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  let subtotal = 0;
  let tax = 0;
  const lineRows = input.items.map((it) => {
    const line = it.quantity * it.unitPrice;
    const v = line * (it.vatRate / 100);
    subtotal += line;
    tax += v;
    return {
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      tax_rate: it.vatRate,
      line_total: line + v,
    };
  });

  const quoteNo = makeQuoteNumber();
  const shareId = newShareId();
  const { data: row, error } = await supabase
    .from('quotes')
    .insert({
      owner_id: ownerId,
      client_id: input.clientId,
      quote_number: quoteNo,
      status: 'draft',
      issue_date: input.issueDate,
      valid_until: input.validUntil,
      currency: input.currency,
      vat_rate: input.vatRate,
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: subtotal + tax,
      notes: input.notes ?? null,
      public_share_id: shareId,
    })
    .select('id')
    .single();
  if (error) {
    // Fallback if public_share_id column missing
    const msg = String((error as any).message ?? '').toLowerCase();
    if (msg.includes('public_share') || msg.includes('column')) {
      const fb = await supabase
        .from('quotes')
        .insert({
          owner_id: ownerId,
          client_id: input.clientId,
          quote_number: quoteNo,
          status: 'draft',
          issue_date: input.issueDate,
          valid_until: input.validUntil,
          currency: input.currency,
          vat_rate: input.vatRate,
          subtotal_amount: subtotal,
          tax_amount: tax,
          total_amount: subtotal + tax,
          notes: input.notes ?? null,
        })
        .select('id')
        .single();
      if (fb.error) throw fb.error;
      const quoteId = String((fb.data as any).id);
      if (lineRows.length) {
        const { error: insErr } = await supabase.from('quote_items').insert(
          lineRows.map((r) => ({
            quote_id: quoteId,
            ...r,
          }))
        );
        if (insErr) throw insErr;
      }
      return { id: quoteId };
    }
    throw error;
  }
  const quoteId = String((row as any).id);

  if (lineRows.length) {
    const { error: insErr } = await supabase.from('quote_items').insert(
      lineRows.map((r) => ({
        quote_id: quoteId,
        ...r,
      }))
    );
    if (insErr) throw insErr;
  }

  return { id: quoteId };
}

/** Ensure quote has a public_share_id and mark as sent when sharing. */
export async function ensureQuoteShareLink(quoteId: string): Promise<{ shareId: string; shareUrl: string }> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data: q, error } = await supabase
    .from('quotes')
    .select('id,public_share_id,status')
    .eq('id', quoteId)
    .eq('owner_id', ownerId)
    .single();
  if (error || !q) throw error ?? new Error('Quote not found');

  let shareId = (q as any).public_share_id ? String((q as any).public_share_id) : null;
  if (!shareId) {
    shareId = newShareId();
    const { error: updErr } = await supabase
      .from('quotes')
      .update({
        public_share_id: shareId,
        status: String((q as any).status) === 'draft' ? 'sent' : (q as any).status,
      })
      .eq('id', quoteId)
      .eq('owner_id', ownerId);
    if (updErr) throw updErr;
  } else if (String((q as any).status) === 'draft') {
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quoteId).eq('owner_id', ownerId);
  }

  const base = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL) || '';
  return { shareId, shareUrl: `${base.replace(/\/$/, '')}/quote/${shareId}` };
}

export async function convertQuoteOnServer(quoteId: string): Promise<{ invoiceId: string }> {
  const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/convert`, { method: 'POST' });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Convert failed');
  return { invoiceId: String(json.invoiceId) };
}
