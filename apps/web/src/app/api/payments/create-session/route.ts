import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildPayFastPaymentUrl } from '@/lib/payments/payfast';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId = String(body.invoiceId ?? '');
    const provider = String(body.provider ?? 'payfast');

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id,invoice_number,total_amount,balance_amount,currency,client:clients(email,name)')
      .eq('id', invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ success: false, error: invErr?.message ?? 'Invoice not found' }, { status: 404 });
    }

    const amount = Number((invoice as any).balance_amount ?? (invoice as any).total_amount ?? 0);
    const currency = String((invoice as any).currency ?? 'ZAR');

    if (!(amount > 0)) {
      return NextResponse.json({ success: false, error: 'Invoice has no outstanding balance.' }, { status: 400 });
    }
    if (currency !== 'ZAR') {
      return NextResponse.json({ success: false, error: 'Online payments currently support ZAR only.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    const { data: sessionRow, error: sessErr } = await supabase
      .from('payment_sessions')
      .insert({
        invoice_id: invoiceId,
        provider,
        method: provider === 'snapscan' ? 'qr' : provider === 'ozow' ? 'instant_eft' : 'card_or_eft',
        amount,
        currency,
        status: 'created',
        meta: { invoiceNumber: (invoice as any).invoice_number ?? null },
      })
      .select('id')
      .single();

    if (sessErr) {
      return NextResponse.json({ success: false, error: sessErr.message }, { status: 500 });
    }

    const sessionId = String((sessionRow as any).id);

    if (provider === 'payfast') {
      const merchantId = process.env.PAYFAST_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
      const sandbox = process.env.PAYFAST_SANDBOX === '1';

      if (!merchantId || !merchantKey) {
        return NextResponse.json(
          { success: false, error: 'Missing env: PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY' },
          { status: 500 }
        );
      }

      const pf = buildPayFastPaymentUrl({
        config: {
          merchantId,
          merchantKey,
          passphrase,
          sandbox,
          returnUrl: `${appUrl}/invoice/${invoiceId}?paid=1`,
          cancelUrl: `${appUrl}/invoice/${invoiceId}?cancelled=1`,
          notifyUrl: `${appUrl}/api/payments/webhook/payfast`,
        },
        mPaymentId: sessionId,
        amount,
        itemName: (invoice as any).invoice_number ? `Invoice ${(invoice as any).invoice_number}` : 'Invoice payment',
        itemDescription: 'TimelyInvoices payment',
        emailAddress: (invoice as any)?.client?.email ? String((invoice as any).client.email) : undefined,
      });

      await supabase.from('payment_sessions').update({ redirect_url: pf.url, status: 'pending' }).eq('id', sessionId);
      return NextResponse.json({ success: true, data: { sessionId, redirectUrl: pf.url } });
    }

    if (provider === 'snapscan') {
      const snapCode = process.env.SNAPSCAN_SNAPCODE;
      if (!snapCode) {
        return NextResponse.json({ success: false, error: 'Missing env: SNAPSCAN_SNAPCODE' }, { status: 500 });
      }
      const cents = Math.round(amount * 100);
      const qrUrl = `https://pos.snapscan.io/qr/${encodeURIComponent(snapCode)}?id=${encodeURIComponent(sessionId)}&amount=${cents}&strict=true`;
      await supabase.from('payment_sessions').update({ redirect_url: qrUrl, status: 'pending' }).eq('id', sessionId);
      return NextResponse.json({ success: true, data: { sessionId, redirectUrl: qrUrl } });
    }

    if (provider === 'ozow') {
      return NextResponse.json(
        { success: false, error: 'Ozow Instant EFT not fully implemented yet (needs merchant credentials + hash spec).' },
        { status: 501 }
      );
    }

    return NextResponse.json({ success: false, error: 'Unsupported provider' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to create payment session.' }, { status: 500 });
  }
}

