import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

    const raw = await request.text(); // raw x-www-form-urlencoded body
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
    const status = String(payload.status ?? '').toLowerCase(); // completed|error|pending...
    const merchantReference = payload.merchantReference ?? payload.merchant_reference ?? payload.reference;
    const sessionId = String(merchantReference ?? '');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing merchantReference' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
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
      // Idempotency: record payment once per session
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('notes', `snapscan_session:${sessionId}`)
        .maybeSingle();

      if (!existing) {
        const invoiceId = String((session as any).invoice_id);
        const amount = Number((session as any).amount ?? 0);
        const currency = String((session as any).currency ?? 'ZAR');

        await supabase.from('payments').insert({
          invoice_id: invoiceId,
          amount,
          currency,
          method: 'mobile_money',
          status: 'completed',
          payment_date: new Date().toISOString().slice(0, 10),
          notes: `snapscan_session:${sessionId}`,
        });

        const { data: invoice } = await supabase
          .from('invoices')
          .select('id,total_amount,paid_amount')
          .eq('id', invoiceId)
          .single();

        if (invoice) {
          const total = Number((invoice as any).total_amount ?? 0);
          const paid = Number((invoice as any).paid_amount ?? 0) + amount;
          const balance = Math.max(0, total - paid);
          const invStatus = balance <= 0 ? 'paid' : 'partial';
          await supabase
            .from('invoices')
            .update({
              paid_amount: paid,
              balance_amount: balance,
              status: invStatus,
              paid_date: balance <= 0 ? new Date().toISOString().slice(0, 10) : null,
            })
            .eq('id', invoiceId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Webhook error' }, { status: 500 });
  }
}

