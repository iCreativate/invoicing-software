import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyPayFastSignature } from '@/lib/payments/payfast';

function asStringMap(obj: any): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj ?? {})) out[k] = String(v ?? '');
  return out;
}

export async function POST(request: Request) {
  // PayFast ITN: form-encoded POST
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const body: Record<string, string> = {};
    params.forEach((v, k) => (body[k] = v));

    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    const sig = verifyPayFastSignature(asStringMap(body), passphrase);
    if (!sig.ok) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const sessionId = String(body.m_payment_id ?? '');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing m_payment_id' }, { status: 400 });
    }

    const paymentStatus = String(body.payment_status ?? '').toUpperCase(); // COMPLETE|FAILED|CANCELLED
    const pfAmountGross = Number(body.amount_gross ?? body.amount ?? 0);

    const supabase = await createSupabaseServerClient();
    const { data: session, error: sessErr } = await supabase
      .from('payment_sessions')
      .select('id,invoice_id,amount,currency,status,provider')
      .eq('id', sessionId)
      .single();

    if (sessErr || !session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Update session status
    const nextStatus =
      paymentStatus === 'COMPLETE'
        ? 'paid'
        : paymentStatus === 'FAILED'
          ? 'failed'
          : paymentStatus === 'CANCELLED'
            ? 'cancelled'
            : 'pending';

    await supabase
      .from('payment_sessions')
      .update({
        status: nextStatus,
        reference: body.pf_payment_id ? String(body.pf_payment_id) : null,
        meta: body,
      })
      .eq('id', sessionId);

    if (paymentStatus === 'COMPLETE') {
      // Idempotency: only record a payment once per session
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('notes', `payfast_session:${sessionId}`)
        .maybeSingle();

      if (!existing) {
        const amount = Math.min(Number((session as any).amount ?? 0), pfAmountGross || Number((session as any).amount ?? 0));
        const currency = String((session as any).currency ?? 'ZAR');
        const invoiceId = String((session as any).invoice_id);

        await supabase.from('payments').insert({
          invoice_id: invoiceId,
          amount,
          currency,
          method: 'card',
          status: 'completed',
          payment_date: new Date().toISOString().slice(0, 10),
          notes: `payfast_session:${sessionId}`,
        });

        // Update invoice aggregates
        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .select('id,total_amount,paid_amount')
          .eq('id', invoiceId)
          .single();
        if (!invErr && invoice) {
          const total = Number((invoice as any).total_amount ?? 0);
          const paid = Number((invoice as any).paid_amount ?? 0) + amount;
          const balance = Math.max(0, total - paid);
          const status = balance <= 0 ? 'paid' : 'partial';
          await supabase
            .from('invoices')
            .update({
              paid_amount: paid,
              balance_amount: balance,
              status,
              paid_date: balance <= 0 ? new Date().toISOString().slice(0, 10) : null,
            })
            .eq('id', invoiceId);
        }
      }
    }

    // PayFast expects 200 OK
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Webhook error' }, { status: 500 });
  }
}

