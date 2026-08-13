import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyPayFastSignature } from '@/lib/payments/payfast';
import { insertPaymentAndReconcile } from '@/lib/payments/recalculateInvoiceFromPayments';

function asStringMap(obj: any): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj ?? {})) out[k] = String(v ?? '');
  return out;
}

export async function POST(request: Request) {
  // PayFast ITN: form-encoded POST — no user session; use service role.
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

    const paymentStatus = String(body.payment_status ?? '').toUpperCase();
    const pfAmountGross = Number(body.amount_gross ?? body.amount ?? 0);
    const externalEventId = body.pf_payment_id
      ? `pf:${body.pf_payment_id}`
      : `pf_session:${sessionId}:${paymentStatus}`;

    const supabase = createSupabaseAdminClient();

    // Idempotent event ledger
    const { error: evtErr } = await supabase.from('payment_events').insert({
      provider: 'payfast',
      external_event_id: externalEventId,
      payment_session_id: sessionId,
      event_type: paymentStatus || 'notify',
      payload: body,
    });
    if (evtErr) {
      const msg = String((evtErr as any).message ?? '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return NextResponse.json({ success: true, data: { duplicate: true } });
      }
      // Table may not exist yet in older envs — continue processing
    }

    const { data: session, error: sessErr } = await supabase
      .from('payment_sessions')
      .select('id,invoice_id,amount,currency,status,provider')
      .eq('id', sessionId)
      .single();

    if (sessErr || !session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

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
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('notes', `payfast_session:${sessionId}`)
        .maybeSingle();

      if (!existing) {
        const amount = Math.min(
          Number((session as any).amount ?? 0),
          pfAmountGross || Number((session as any).amount ?? 0)
        );
        const currency = String((session as any).currency ?? 'ZAR');
        const invoiceId = String((session as any).invoice_id);

        await insertPaymentAndReconcile(supabase, {
          invoiceId,
          amount,
          currency,
          method: 'card',
          paymentDate: new Date().toISOString().slice(0, 10),
          notes: `payfast_session:${sessionId}`,
          provider: 'payfast',
          externalReference: body.pf_payment_id ? String(body.pf_payment_id) : null,
        });

        await supabase
          .from('payment_events')
          .update({ invoice_id: invoiceId })
          .eq('provider', 'payfast')
          .eq('external_event_id', externalEventId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Webhook error' }, { status: 500 });
  }
}
