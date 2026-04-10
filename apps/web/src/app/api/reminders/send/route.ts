import { NextResponse } from 'next/server';
import {
  ERR_RESEND_MISSING,
  ERR_WHATSAPP_MISSING,
  getResend,
  getResendFromEmail,
  getTwilio,
  isWhatsappEnvReady,
} from '@/lib/integrations/messaging';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const channel = String(body.channel ?? '');
    const invoiceId = body.invoiceId ? String(body.invoiceId) : null;
    const toEmail = body.toEmail ? String(body.toEmail) : null;
    const toWhatsapp = body.toWhatsapp ? String(body.toWhatsapp) : null;
    const message = String(body.message ?? '').trim();

    if (!message) return NextResponse.json({ success: false, error: 'message required' }, { status: 400 });
    if (channel !== 'email' && channel !== 'whatsapp') {
      return NextResponse.json({ success: false, error: 'channel must be email|whatsapp' }, { status: 400 });
    }

    if (channel === 'email') {
      if (!toEmail) return NextResponse.json({ success: false, error: 'toEmail required' }, { status: 400 });
      const resend = await getResend();
      if (!resend) {
        return NextResponse.json({ success: false, error: ERR_RESEND_MISSING }, { status: 503 });
      }
      await resend.emails.send({
        from: getResendFromEmail(),
        to: [toEmail],
        subject: 'Invoice reminder',
        html: `<p>${message.replaceAll('\n', '<br/>')}</p>`,
      });
      if (invoiceId) {
        const supabase = await createSupabaseServerClient(request);
        const { error: logErr } = await supabase.from('reminder_events').insert({ invoice_id: invoiceId, channel: 'email' });
        void logErr;
      }
      return NextResponse.json({ success: true });
    }

    if (!toWhatsapp) return NextResponse.json({ success: false, error: 'toWhatsapp required' }, { status: 400 });
    if (!isWhatsappEnvReady()) {
      return NextResponse.json({ success: false, error: ERR_WHATSAPP_MISSING }, { status: 503 });
    }
    const twilio = await getTwilio();
    if (!twilio) {
      return NextResponse.json({ success: false, error: ERR_WHATSAPP_MISSING }, { status: 503 });
    }
    await twilio.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${toWhatsapp}`,
      body: message,
    });

    if (invoiceId) {
      const supabase = await createSupabaseServerClient(request);
      const { error: logErr } = await supabase.from('reminder_events').insert({ invoice_id: invoiceId, channel: 'whatsapp' });
      void logErr;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Send failed' }, { status: 500 });
  }
}
