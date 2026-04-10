import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, assertRowOwnedByWorkspace, getWorkspaceContext } from '@/lib/auth/workspace';

function makeInvoiceNumber() {
  const y = String(new Date().getFullYear());
  const n = Math.floor(10000 + Math.random() * 90000);
  return `INV-${y}-${n}`;
}

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: quoteId } = await ctx.params;
    const supabase = await createSupabaseServerClient(_request);
    const ctxW = await getWorkspaceContext(supabase);
    if (!ctxW) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    assertCanEdit(ctxW);

    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('id,owner_id,client_id,currency,vat_rate,subtotal_amount,tax_amount,total_amount,notes,status')
      .eq('id', quoteId)
      .eq('owner_id', ctxW.workspaceOwnerId)
      .single();

    if (qErr || !quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    assertRowOwnedByWorkspace((quote as any).owner_id, ctxW);

    if (String((quote as any).status) === 'converted') {
      const { data: existing } = await supabase
        .from('quotes')
        .select('converted_invoice_id')
        .eq('id', quoteId)
        .single();
      const invId = (existing as any)?.converted_invoice_id;
      if (invId) return NextResponse.json({ success: true, invoiceId: String(invId) });
    }

    const { data: items, error: iErr } = await supabase
      .from('quote_items')
      .select('description,quantity,unit_price,tax_rate,line_total')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });
    if (iErr) throw iErr;

    const shareId = crypto.randomUUID();
    const invNo = makeInvoiceNumber();
    const total = Number((quote as any).total_amount ?? 0);

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert({
        owner_id: ctxW.workspaceOwnerId,
        client_id: (quote as any).client_id,
        invoice_number: invNo,
        status: 'draft',
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
        currency: String((quote as any).currency ?? 'ZAR'),
        vat_rate: Number((quote as any).vat_rate ?? 15),
        subtotal_amount: Number((quote as any).subtotal_amount ?? 0),
        tax_amount: Number((quote as any).tax_amount ?? 0),
        total_amount: total,
        paid_amount: 0,
        balance_amount: total,
        notes: (quote as any).notes ?? null,
        public_share_id: shareId,
        template_id: 'modern',
      })
      .select('id')
      .single();
    if (invErr) throw invErr;
    const invoiceId = String((inv as any).id);

    if (items?.length) {
      const { error: liErr } = await supabase.from('invoice_items').insert(
        items.map((it: any) => ({
          invoice_id: invoiceId,
          description: String(it.description ?? ''),
          quantity: Number(it.quantity ?? 0),
          unit_price: Number(it.unit_price ?? 0),
          tax_rate: Number(it.tax_rate ?? 15),
          line_total: Number(it.line_total ?? 0),
        }))
      );
      if (liErr) throw liErr;
    }

    const { error: uqErr } = await supabase
      .from('quotes')
      .update({ status: 'converted', converted_invoice_id: invoiceId })
      .eq('id', quoteId)
      .eq('owner_id', ctxW.workspaceOwnerId);
    if (uqErr) throw uqErr;

    return NextResponse.json({ success: true, invoiceId });
  } catch (e: any) {
    const msg = String(e?.message ?? '');
    const status = msg.includes('permission') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg || 'Convert failed' }, { status });
  }
}
