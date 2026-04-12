import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, getWorkspaceContext } from '@/lib/auth/workspace';
import { calcInvoiceTotals, linesToPayload, type LineInput } from '@/lib/invoices/calcLines';
import { logInvoiceTimelineEvent } from '@/lib/invoices/timelineServer';
import { parseImportFileToTabular } from '@/lib/import/parseImportSource';
import { groupInvoiceLines } from '@/lib/import/invoiceQuoteRows';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 500;

function makeInvoiceNumber() {
  const y = String(new Date().getUTCFullYear());
  const n = Math.floor(10000 + Math.random() * 90000);
  return `INV-${y}-${n}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    try {
      assertCanEdit(ctx);
    } catch {
      return NextResponse.json({ success: false, error: 'You do not have permission to import.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File too large (max 8MB).' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const parsed = await parseImportFileToTabular(buf, file, {
      pdf422:
        'Could not read a table from this PDF. Use CSV or Excel with columns: client_email, issue_date, due_date, currency, description, quantity, unit_price, tax_rate (optional), invoice_number (optional).',
      image422:
        'Could not read a table from this image. Use a clear screenshot with those columns visible, or import CSV/Excel.',
      unsupported400: 'Unsupported format. Use .csv, .xlsx, .xls, .pdf, or an image (.png, .jpg, .webp, .gif, .bmp).',
    });
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status });
    }
    const tab = parsed.tab;

    if (tab.rows.length > MAX_ROWS) {
      return NextResponse.json({ success: false, error: `Too many rows (max ${MAX_ROWS}).` }, { status: 400 });
    }

    const { groups, errors: groupErrors } = groupInvoiceLines(tab);
    const errors: string[] = [...groupErrors];
    let imported = 0;

    for (const [, bundle] of groups) {
      const { meta, lines } = bundle;
      const { data: client, error: cErr } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_id', ctx.workspaceOwnerId)
        .ilike('email', meta.clientEmail)
        .maybeSingle();

      if (cErr || !client) {
        errors.push(`No client with email "${meta.clientEmail}" (add the client first).`);
        continue;
      }

      const clientId = String((client as { id: string }).id);
      const items: LineInput[] = lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        tax_rate: l.taxRate,
      }));
      const totals = calcInvoiceTotals(items);
      const shareId = crypto.randomUUID();
      const invNo = meta.invoiceNumber?.trim() || makeInvoiceNumber();

      const { data: row, error: insErr } = await supabase
        .from('invoices')
        .insert({
          owner_id: ctx.workspaceOwnerId,
          client_id: clientId,
          invoice_number: invNo,
          issue_date: meta.issueDate,
          due_date: meta.dueDate,
          currency: meta.currency,
          template_id: 'modern',
          status: 'draft',
          vat_rate: 15,
          subtotal_amount: totals.subtotal_amount,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          paid_amount: 0,
          balance_amount: totals.total_amount,
          public_share_id: shareId,
        })
        .select('id')
        .single();

      if (insErr) {
        errors.push(`Invoice ${invNo}: ${insErr.message}`);
        continue;
      }

      const invoiceId = String((row as { id: string }).id);
      const payload = linesToPayload(items);
      const { error: itemsErr } = await supabase.from('invoice_items').insert(
        payload.map((it) => ({
          invoice_id: invoiceId,
          ...it,
        }))
      );
      if (itemsErr) {
        errors.push(`Invoice ${invNo} lines: ${itemsErr.message}`);
        await supabase.from('invoices').delete().eq('id', invoiceId);
        continue;
      }

      await logInvoiceTimelineEvent(supabase, invoiceId, 'created', { source: 'import' });
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        invoiceGroups: groups.size,
        errors: errors.slice(0, 80),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Import failed.' }, { status: 500 });
  }
}
