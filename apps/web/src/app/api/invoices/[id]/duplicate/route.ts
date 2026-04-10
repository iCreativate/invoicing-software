import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { logInvoiceTimelineEvent } from '@/lib/invoices/timelineServer';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(_request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const { data: src, error: srcErr } = await supabase
      .from('invoices')
      .select(
        `
        client_id,
        invoice_number,
        issue_date,
        due_date,
        currency,
        template_id,
        vat_rate,
        notes,
        items:invoice_items(description,quantity,unit_price,tax_rate,line_total)
      `
      )
      .eq('id', id)
      .eq('owner_id', ctx.workspaceOwnerId)
      .single();

    if (srcErr || !src) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    const shareId = crypto.randomUUID();
    const baseNo = String((src as any).invoice_number ?? 'INV').replace(/\s+/g, '');
    const newNo = `${baseNo}-COPY-${String(Date.now()).slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);
    const totals = ((src as any).items ?? []).reduce(
      (acc: { sub: number; tax: number }, it: any) => {
        const net = Number(it.quantity ?? 0) * Number(it.unit_price ?? 0);
        const tr = Number(it.tax_rate ?? 0);
        return { sub: acc.sub + net, tax: acc.tax + (net * tr) / 100 };
      },
      { sub: 0, tax: 0 }
    );
    const total = Math.round((totals.sub + totals.tax) * 100) / 100;

    const { data: row, error: insErr } = await supabase
      .from('invoices')
      .insert({
        owner_id: ctx.workspaceOwnerId,
        client_id: (src as any).client_id,
        invoice_number: newNo,
        issue_date: today,
        due_date: String((src as any).due_date ?? today),
        currency: String((src as any).currency ?? 'ZAR'),
        template_id: String((src as any).template_id ?? 'modern'),
        status: 'draft',
        vat_rate: Number((src as any).vat_rate ?? 15),
        subtotal_amount: Math.round(totals.sub * 100) / 100,
        tax_amount: Math.round(totals.tax * 100) / 100,
        total_amount: total,
        paid_amount: 0,
        balance_amount: total,
        notes: (src as any).notes ?? null,
        public_share_id: shareId,
      })
      .select('id')
      .single();

    if (insErr) throw insErr;
    const newId = String((row as any).id);

    const items = ((src as any).items ?? []).map((it: any) => ({
      invoice_id: newId,
      description: String(it.description ?? 'Line item'),
      quantity: Number(it.quantity ?? 1),
      unit_price: Number(it.unit_price ?? 0),
      tax_rate: Number(it.tax_rate ?? 15),
      line_total: Number(it.line_total ?? 0),
    }));

    if (items.length) {
      const { error: itErr } = await supabase.from('invoice_items').insert(items);
      if (itErr) throw itErr;
    }

    await logInvoiceTimelineEvent(supabase, newId, 'created', { duplicatedFrom: id });

    return NextResponse.json({ success: true, data: { id: newId } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Duplicate failed.' }, { status: 500 });
  }
}
