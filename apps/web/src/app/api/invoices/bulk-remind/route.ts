import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { applyEmailTemplate } from '@/lib/email/templates';
import { getResend, getResendFromEmail, ERR_RESEND_MISSING } from '@/lib/integrations/messaging';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const body = await request.json();
    const ids = Array.isArray(body.invoiceIds) ? body.invoiceIds.map((x: any) => String(x)) : [];
    if (!ids.length) return NextResponse.json({ success: false, error: 'invoiceIds required' }, { status: 400 });

    const resend = await getResend();
    if (!resend) {
      return NextResponse.json({ success: false, error: ERR_RESEND_MISSING }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let sent = 0;
    const errors: string[] = [];

    let companyName = 'TimelyInvoices';
    let reminderTemplate: string | null = null;
    let profRes = await supabase
      .from('company_profiles')
      .select('company_name,email_template_reminder')
      .eq('owner_id', ctx.workspaceOwnerId)
      .maybeSingle();
    if (profRes.error && String(profRes.error.message ?? '').toLowerCase().includes('email_template')) {
      profRes = await supabase.from('company_profiles').select('company_name').eq('owner_id', ctx.workspaceOwnerId).maybeSingle();
    }
    if (!profRes.error && profRes.data) {
      companyName = (profRes.data as any).company_name ? String((profRes.data as any).company_name) : companyName;
      reminderTemplate =
        (profRes.data as any).email_template_reminder != null
          ? String((profRes.data as any).email_template_reminder)
          : null;
    }

    for (const invoiceId of ids.slice(0, 25)) {
      const { data: row, error } = await supabase
        .from('invoices')
        .select(
          `
          id,
          invoice_number,
          public_share_id,
          balance_amount,
          status,
          client:clients(name,email)
        `
        )
        .eq('id', invoiceId)
        .eq('owner_id', ctx.workspaceOwnerId)
        .maybeSingle();

      if (error || !row) {
        errors.push(`${invoiceId}: not found`);
        continue;
      }

      const email = (row as any).client?.email ? String((row as any).client.email) : '';
      if (!email) {
        errors.push(`${invoiceId}: client has no email`);
        continue;
      }

      const shareId = (row as any).public_share_id ? String((row as any).public_share_id) : null;
      if (!shareId) {
        errors.push(`${invoiceId}: missing share link`);
        continue;
      }

      const balance = Number((row as any).balance_amount ?? 0);
      const st = String((row as any).status ?? '');
      if (balance <= 0 || st === 'paid') {
        errors.push(`${invoiceId}: nothing owed`);
        continue;
      }

      const shareUrl = `${appUrl}/invoice/${shareId}`;
      const invNo = String((row as any).invoice_number ?? invoiceId.slice(0, 8));
      const clientName = (row as any).client?.name ? String((row as any).client.name) : '';

      const vars: Record<string, string> = {
        invoice_number: invNo,
        share_url: shareUrl,
        view_url: shareUrl,
        company_name: companyName,
        balance: String(balance),
        client_name: clientName,
      };
      const fallbackHtml = `<p>This is a friendly reminder about invoice <strong>${invNo}</strong>.</p><p><a href="${shareUrl}">View and pay</a></p>`;
      const html = applyEmailTemplate(reminderTemplate, vars, fallbackHtml);

      try {
        await resend.emails.send({
          from: getResendFromEmail(),
          to: [email],
          subject: `Reminder: Invoice ${invNo}`,
          html,
        });
        sent += 1;
      } catch (e: any) {
        errors.push(`${invoiceId}: ${e?.message ?? 'send failed'}`);
      }
    }

    return NextResponse.json({ success: true, data: { sent, errors } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Bulk remind failed.' }, { status: 500 });
  }
}
