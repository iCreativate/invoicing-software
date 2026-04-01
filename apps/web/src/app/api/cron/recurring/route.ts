import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function requireCronSecret(request: Request) {
  if (process.env.VERCEL && request.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const reqUrl = new URL(request.url);
  if (reqUrl.searchParams.get('secret') === secret) return true;
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  return bearer === secret;
}

function bumpNextRun(fromISO: string, frequency: string): string {
  const d = new Date(fromISO + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return fromISO;
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'quarterly') d.setDate(d.getDate() + 90);
  else d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function makeInvoiceNumber() {
  const y = String(new Date().getFullYear());
  const n = Math.floor(10000 + Math.random() * 90000);
  return `INV-${y}-${n}`;
}

export async function GET(request: Request) {
  if (!requireCronSecret(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Missing Supabase service env' }, { status: 500 });
  }

  const admin = createClient(url, serviceKey);
  const today = new Date().toISOString().slice(0, 10);

  const { data: schedules, error: listErr } = await admin
    .from('recurring_schedules')
    .select(
      'id,owner_id,client_id,title,line_description,quantity,unit_price,vat_rate,currency,frequency,next_run_date,reminder_days_before,remind_email,remind_whatsapp,whatsapp_phone'
    )
    .eq('active', true)
    .lte('next_run_date', today);
  if (listErr) return NextResponse.json({ ok: false, error: listErr.message }, { status: 500 });

  const results: string[] = [];

  for (const s of schedules ?? []) {
    const row = s as any;
    const ownerId = String(row.owner_id ?? '');
    const clientId = String(row.client_id ?? '');
    const qty = Number(row.quantity ?? 1);
    const unit = Number(row.unit_price ?? 0);
    const vat = Number(row.vat_rate ?? 15);
    const lineEx = qty * unit;
    const tax = lineEx * (vat / 100);
    const total = lineEx + tax;
    const shareId = crypto.randomUUID();
    const invNo = makeInvoiceNumber();
    const issueDate = today;
    const dueDate = bumpNextRun(issueDate, 'monthly');

    const { data: inv, error: invErr } = await admin
      .from('invoices')
      .insert({
        owner_id: ownerId,
        client_id: clientId,
        invoice_number: invNo,
        status: 'sent',
        issue_date: issueDate,
        due_date: dueDate,
        currency: String(row.currency ?? 'ZAR'),
        vat_rate: vat,
        subtotal_amount: lineEx,
        tax_amount: tax,
        total_amount: total,
        paid_amount: 0,
        balance_amount: total,
        notes: String(row.title ?? 'Recurring invoice'),
        public_share_id: shareId,
        template_id: 'modern',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (invErr) {
      results.push(`fail ${row.id}: ${invErr.message}`);
      continue;
    }
    const invoiceId = String((inv as any).id);

    await admin.from('invoice_items').insert({
      invoice_id: invoiceId,
      description: String(row.line_description ?? 'Services'),
      quantity: qty,
      unit_price: unit,
      tax_rate: vat,
      line_total: total,
    });

    const nextRun = bumpNextRun(String(row.next_run_date ?? today), String(row.frequency ?? 'monthly'));
    await admin
      .from('recurring_schedules')
      .update({ next_run_date: nextRun, last_generated_invoice_id: invoiceId })
      .eq('id', row.id);

    const { data: client } = await admin.from('clients').select('name,email,phone').eq('id', clientId).maybeSingle();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const payUrl = `${appUrl}/invoice/${shareId}`;
    const msg = `Hi ${(client as any)?.name ?? ''}, your invoice ${invNo} is ready. Pay or view: ${payUrl}`;

    if (row.remind_email && (client as any)?.email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'TimelyInvoices <invoices@timelyinvoices.app>',
          to: [String((client as any).email)],
          subject: `Invoice ${invNo}`,
          html: `<p>${msg.replaceAll('\n', '<br/>')}</p>`,
        });
      } catch {
        // optional
      }
    }

    const waTo = row.remind_whatsapp ? row.whatsapp_phone || (client as any)?.phone : null;
    if (waTo && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
      try {
        const twilio = (await import('twilio')).default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilio.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
          to: `whatsapp:${String(waTo).replace(/^whatsapp:/, '')}`,
          body: msg,
        });
      } catch {
        // optional
      }
    }

    results.push(`ok ${row.id} -> ${invoiceId}`);
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
