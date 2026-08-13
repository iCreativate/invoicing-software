import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { insertPaymentAndReconcile } from '@/lib/payments/recalculateInvoiceFromPayments';

function secureEq(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export async function POST(request: Request) {
  try {
    const authKey = process.env.SNAPSCAN_WEBHOOK_AUTH_KEY;
    if (!authKey) {
      return NextResponse.json({ success: false, error: 'Missing env: SNAPSCAN_WEBHOOK_AUTH_KEY' }, { status: 500 });
    }

    const raw = await request.text();
    const signature = crypto.createHmac('sha256', authKey).update(raw).digest('hex');
    const expected = `SnapScan signature=${signature}`;
    const received = request.headers.get('authorization') ?? '';

    if (!secureEq(expected, received)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = new URLSearchParams(raw);
    const payloadStr = params.get('payload') ?? '';
    if (!payloadStr) {
      return NextResponse.json({ success: false, error: 'Missing payload' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    const status = String(payload.status ?? '').toLowerCase();
    const merchantReference = payload.merchantReference ?? payload.merchant_reference ?? payload.reference;
    const sessionId = String(merchantReference ?? '');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing merchantReference' }, { status: 400 });
    }

    const externalEventId = payload.id != null ? `snap:${payload.id}` : `snap_session:${sessionId}:${status}`;
    const supabase = createSupabaseAdminClient();

    const { error: evtErr } = await supabase.from('payment_events').insert({
      provider: 'snapscan',
      external_event_id: externalEventId,
      payment_session_id: sessionId,
      event_type: status || 'notify',
      payload,
    });
    if (evtErr) {
      const msg = String((evtErr as any).message ?? '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return NextResponse.json({ success: true, data: { duplicate: true } });
      }
    }

    const { data: session } = await supabase
      .from('payment_sessions')
      .select('id,invoice_id,amount,currency,status')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const nextStatus = status === 'completed' ? 'paid' : status === 'error' ? 'failed' : 'pending';

    await supabase
      .from('payment_sessions')
      .update({
        status: nextStatus,
        reference: payload.id ? String(payload.id) : null,
        meta: payload,
      })
      .eq('id', sessionId);

    if (status === 'completed') {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('notes', `snapscan_session:${sessionId}`)
        .maybeSingle();

      if (!existing) {
        const invoiceId = String((session as any).invoice_id);
        const amount = Number((session as any).amount ?? 0);
        const currency = String((session as any).currency ?? 'ZAR');

        await insertPaymentAndReconcile(supabase, {
          invoiceId,
          amount,
          currency,
          method: 'mobile_money',
          paymentDate: new Date().toISOString().slice(0, 10),
          notes: `snapscan_session:${sessionId}`,
          provider: 'snapscan',
          externalReference: payload?.id != null ? String(payload.id) : null,
        });

        await supabase
          .from('payment_events')
          .update({ invoice_id: invoiceId })
          .eq('provider', 'snapscan')
          .eq('external_event_id', externalEventId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Webhook error' }, { status: 500 });
  }
}
