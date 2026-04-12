import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, getWorkspaceContext } from '@/lib/auth/workspace';
import { parseImportFileToTabular } from '@/lib/import/parseImportSource';
import { groupQuoteLines } from '@/lib/import/invoiceQuoteRows';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 500;

function makeQuoteNumber() {
  const y = String(new Date().getFullYear());
  const n = Math.floor(10000 + Math.random() * 90000);
  return `QT-${y}-${n}`;
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
        'Could not read a table from this PDF. Use CSV or Excel with columns: client_email, issue_date, valid_until, currency, description, quantity, unit_price, tax_rate (optional), quote_number (optional).',
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

    const { groups, errors: groupErrors } = groupQuoteLines(tab);
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
      let subtotal = 0;
      let tax = 0;
      const lineRows = lines.map((it) => {
        const line = it.quantity * it.unitPrice;
        const v = line * (it.taxRate / 100);
        subtotal += line;
        tax += v;
        return {
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          tax_rate: it.taxRate,
          line_total: line + v,
        };
      });

      const quoteNo = meta.quoteNumber?.trim() || makeQuoteNumber();
      const vatRate = lines[0]?.taxRate ?? 15;

      const { data: row, error: insErr } = await supabase
        .from('quotes')
        .insert({
          owner_id: ctx.workspaceOwnerId,
          client_id: clientId,
          quote_number: quoteNo,
          status: 'draft',
          issue_date: meta.issueDate,
          valid_until: meta.validUntil,
          currency: meta.currency,
          vat_rate: vatRate,
          subtotal_amount: subtotal,
          tax_amount: tax,
          total_amount: subtotal + tax,
          notes: null,
        })
        .select('id')
        .single();

      if (insErr) {
        errors.push(`Quote ${quoteNo}: ${insErr.message}`);
        continue;
      }

      const quoteId = String((row as { id: string }).id);
      const { error: liErr } = await supabase.from('quote_items').insert(
        lineRows.map((r) => ({
          quote_id: quoteId,
          ...r,
        }))
      );
      if (liErr) {
        errors.push(`Quote ${quoteNo} lines: ${liErr.message}`);
        await supabase.from('quotes').delete().eq('id', quoteId);
        continue;
      }

      imported++;
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        quoteGroups: groups.size,
        errors: errors.slice(0, 80),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Import failed.' }, { status: 500 });
  }
}
