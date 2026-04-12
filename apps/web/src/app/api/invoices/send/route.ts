import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { applyEmailTemplate } from '@/lib/email/templates';
import {
  ERR_RESEND_MISSING,
  ERR_WHATSAPP_MISSING,
  getResend,
  getResendFromEmail,
  getTwilio,
  isWhatsappEnvReady,
} from '@/lib/integrations/messaging';
import { logInvoiceTimelineEvent } from '@/lib/invoices/timelineServer';
import { maybeDeductInventoryForSentInvoice } from '@/lib/inventory/invoiceInventory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId = String(body.invoiceId || '');
    const toEmail = body.toEmail ? String(body.toEmail) : null;
    const toWhatsapp = body.toWhatsapp ? String(body.toWhatsapp) : null;

    if (!invoiceId) return NextResponse.json({ success: false, error: 'invoiceId required' }, { status: 400 });

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

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

    try {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

      const { count, error: countErr } = await supabase
        .from('invoices')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_id', ctx.workspaceOwnerId)
        .not('sent_at', 'is', null)
        .gte('sent_at', start.toISOString())
        .lt('sent_at', end.toISOString());

      if (!countErr && typeof count === 'number' && count >= 10) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Free plan limit reached: 10 invoices/month. Upgrade to Starter to send unlimited invoices.',
          },
          { status: 402 }
        );
      }
    } catch {
      // ignore if schema not migrated yet
    }

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id,owner_id,public_share_id,invoice_number,total_amount,due_date,balance_amount,currency')
      .eq('id', invoiceId)
      .maybeSingle();
    if (invErr) throw invErr;
    if (!inv) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }
    if (String((inv as any).owner_id ?? '') !== ctx.workspaceOwnerId) {
      return NextResponse.json({ success: false, error: 'Not allowed.' }, { status: 403 });
    }

    const shareId = (inv as any).public_share_id ? String((inv as any).public_share_id) : crypto.randomUUID();
    const { error: updErr } = await supabase
      .from('invoices')
      .update({ public_share_id: shareId, status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('owner_id', ctx.workspaceOwnerId);
    if (updErr) throw updErr;

    try {
      await maybeDeductInventoryForSentInvoice(supabase, invoiceId, ctx.workspaceOwnerId);
    } catch {
      // If inventory columns/catalog are missing, sending still succeeds.
    }

    await logInvoiceTimelineEvent(supabase, invoiceId, 'sent', {});

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const shareUrl = `${appUrl}/invoice/${shareId}`;

    let companyName = 'TimelyInvoices';
    let templateInvoice: string | null = null;
    let profRes = await supabase
      .from('company_profiles')
      .select('company_name,email_template_invoice')
      .eq('owner_id', ctx.workspaceOwnerId)
      .maybeSingle();
    if (profRes.error && String(profRes.error.message ?? '').toLowerCase().includes('email_template')) {
      profRes = await supabase.from('company_profiles').select('company_name').eq('owner_id', ctx.workspaceOwnerId).maybeSingle();
    }
    if (!profRes.error && profRes.data) {
      companyName = (profRes.data as any).company_name ? String((profRes.data as any).company_name) : companyName;
      templateInvoice =
        (profRes.data as any).email_template_invoice != null
          ? String((profRes.data as any).email_template_invoice)
          : null;
    }

    const invNo = String((inv as any).invoice_number ?? '');
    const total = Number((inv as any).total_amount ?? 0);
    const due = String((inv as any).due_date ?? '').slice(0, 10);
    const bal = Number((inv as any).balance_amount ?? 0);
    const curr = String((inv as any).currency ?? 'ZAR');

    const templateVars: Record<string, string> = {
      invoice_number: invNo,
      share_url: shareUrl,
      view_url: shareUrl,
      company_name: companyName,
      total_amount: String(total),
      due_date: due,
      balance: String(bal),
      currency: curr,
    };

    const fallbackHtml = `<p>Your invoice is ready.</p><p><a href="${shareUrl}">View invoice</a></p>`;
    const emailHtml = applyEmailTemplate(templateInvoice, templateVars, fallbackHtml);
    const subject = `Invoice ${invNo} from ${companyName}`;

    if (toEmail) {
      const resend = await getResend();
      if (resend) {
        await resend.emails.send({
          from: getResendFromEmail(),
          to: [toEmail],
          subject,
          html: emailHtml,
        });
      }
    }

    if (toWhatsapp && process.env.TWILIO_WHATSAPP_FROM) {
      const twilio = await getTwilio();
      if (twilio) {
        const plain = `Invoice ${invNo} from ${companyName}: ${shareUrl}`;
        await twilio.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
          to: `whatsapp:${toWhatsapp}`,
          body: plain,
        });
      }
    }

    return NextResponse.json({ success: true, data: { shareId, shareUrl } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Send failed' }, { status: 500 });
  }
}
