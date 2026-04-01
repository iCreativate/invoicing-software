import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Optional providers (only used if env vars present)
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
    const invoiceId = String(body.invoiceId || '');
    const toEmail = body.toEmail ? String(body.toEmail) : null;
    const toWhatsapp = body.toWhatsapp ? String(body.toWhatsapp) : null;

    if (!invoiceId) return NextResponse.json({ success: false, error: 'invoiceId required' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: auth } = await supabase.auth.getUser();
    const ownerId = auth.user?.id ?? null;
    if (!ownerId) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    // FREE tier guard (server-side): up to 10 sent invoices per calendar month.
    // Best-effort until schema.sql (owner_id) is applied.
    try {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

      const { count, error: countErr } = await supabase
        .from('invoices')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_id', ownerId)
        .not('sent_at', 'is', null)
        .gte('sent_at', start.toISOString())
        .lt('sent_at', end.toISOString());

      if (!countErr && typeof count === 'number' && count >= 10) {
        return NextResponse.json(
          { success: false, error: 'Free plan limit reached: 10 invoices/month. Upgrade to Starter to send unlimited invoices.' },
          { status: 402 }
        );
      }
    } catch {
      // ignore if schema not migrated yet
    }

    // Ensure share id (don't rotate if already exists)
    const { data: existing, error: existingErr } = await supabase
      .from('invoices')
      .select('public_share_id')
      .eq('id', invoiceId)
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (existingErr) throw existingErr;

    const shareId = (existing as any)?.public_share_id ? String((existing as any).public_share_id) : crypto.randomUUID();
    const { error: updErr } = await supabase
      .from('invoices')
      .update({ public_share_id: shareId, status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('owner_id', ownerId);
    if (updErr) throw updErr;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const shareUrl = `${appUrl}/invoice/${shareId}`;

    // Email via Resend (if configured)
    if (toEmail) {
      const resend = await getResend();
      if (resend) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'TimelyInvoices <invoices@timelyinvoices.app>',
          to: [toEmail],
          subject: 'Invoice from TimelyInvoices',
          html: `<p>Your invoice is ready.</p><p><a href="${shareUrl}">View invoice</a></p>`,
        });
      }
    }

    // WhatsApp via Twilio (if configured)
    if (toWhatsapp && process.env.TWILIO_WHATSAPP_FROM) {
      const twilio = await getTwilio();
      if (twilio) {
        await twilio.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
          to: `whatsapp:${toWhatsapp}`,
          body: `Your invoice is ready: ${shareUrl}`,
        });
      }
    }

    return NextResponse.json({ success: true, data: { shareId, shareUrl } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Send failed' }, { status: 500 });
  }
}

