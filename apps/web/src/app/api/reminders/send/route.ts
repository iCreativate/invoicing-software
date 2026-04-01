import { NextResponse } from 'next/server';

let ResendClient: any = null;
let TwilioClient: any = null;

async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!ResendClient) {
    const mod = await import('resend');
    ResendClient = mod.Resend;
  }
  return new ResendClient(process.env.RESEND_API_KEY);
}

async function getTwilio() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!TwilioClient) {
    const mod = await import('twilio');
    TwilioClient = mod.default ?? mod;
  }
  return TwilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const channel = String(body.channel ?? '');
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
        return NextResponse.json({ success: false, error: 'Email not configured (missing RESEND_API_KEY)' }, { status: 500 });
      }
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'TimelyInvoices <invoices@timelyinvoices.app>',
        to: [toEmail],
        subject: 'Invoice reminder',
        html: `<p>${message.replaceAll('\n', '<br/>')}</p>`,
      });
      return NextResponse.json({ success: true });
    }

    // whatsapp
    if (!toWhatsapp) return NextResponse.json({ success: false, error: 'toWhatsapp required' }, { status: 400 });
    if (!process.env.TWILIO_WHATSAPP_FROM) {
      return NextResponse.json({ success: false, error: 'WhatsApp not configured (missing TWILIO_WHATSAPP_FROM)' }, { status: 500 });
    }
    const twilio = await getTwilio();
    if (!twilio) {
      return NextResponse.json({ success: false, error: 'WhatsApp not configured (missing TWILIO creds)' }, { status: 500 });
    }
    await twilio.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${toWhatsapp}`,
      body: message,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Send failed' }, { status: 500 });
  }
}

