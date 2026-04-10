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

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id,total_amount,balance_amount,currency')
      .eq('id', id)
      .eq('owner_id', ctx.workspaceOwnerId)
      .single();

    if (invErr || !inv) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    const total = Number((inv as any).total_amount ?? 0);
    const balance = Number((inv as any).balance_amount ?? 0);
    if (balance <= 0) {
      return NextResponse.json({ success: true, data: { id, alreadyPaid: true } });
    }
    const payAmount = balance;
    const paidDate = new Date().toISOString().slice(0, 10);
    const currency = String((inv as any).currency ?? 'ZAR');

    if (payAmount > 0) {
      const { error: payErr } = await supabase.from('payments').insert({
        invoice_id: id,
        amount: payAmount,
        currency,
        method: 'bank_transfer',
        status: 'completed',
        payment_date: paidDate,
        notes: 'Marked as paid from dashboard',
      });
      if (payErr) throw payErr;
    }

    const { error: upErr } = await supabase
      .from('invoices')
      .update({
        paid_amount: total,
        balance_amount: 0,
        status: 'paid',
        paid_date: paidDate,
      })
      .eq('id', id)
      .eq('owner_id', ctx.workspaceOwnerId);

    if (upErr) throw upErr;

    await logInvoiceTimelineEvent(supabase, id, 'paid', { source: 'mark_paid' });

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to mark paid.' }, { status: 500 });
  }
}
