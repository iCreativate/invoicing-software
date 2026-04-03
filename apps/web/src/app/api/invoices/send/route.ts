import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  ERR_RESEND_MISSING,
  ERR_WHATSAPP_MISSING,
  getResend,
  getResendFromEmail,
  getTwilio,
  isWhatsappEnvReady,
} from '@/lib/integrations/messaging';

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

    if (toEmail) {
      const resend = await getResend();
      if (!resend) {
        return NextResponse.json({ success: false, error: ERR_RESEND_MISSING }, { status: 503 });
      }
    }

    if (toWhatsapp) {
      if (!isWhatsappEnvReady()) {
        return NextResponse.json({ success: false, error: ERR_WHATSAPP_MISSING }, { status: 503 });
      }
      const twilio = await getTwilio();
      if (!twilio) {
        return NextResponse.json({ success: false, error: ERR_WHATSAPP_MISSING }, { status: 503 });
      }
    }

    // FREE tier guard (server-side): up to 10 sent invoices per calendar month.
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

    if (toEmail) {
      const resend = await getResend();
      if (resend) {
        await resend.emails.send({
          from: getResendFromEmail(),
          to: [toEmail],
          subject: 'Invoice from TimelyInvoices',
          html: `<p>Your invoice is ready.</p><p><a href="${shareUrl}">View invoice</a></p>`,
        });
      }
    }

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
