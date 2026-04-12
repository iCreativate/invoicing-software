import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, getWorkspaceContext } from '@/lib/auth/workspace';
import { parseImportFileToTabular } from '@/lib/import/parseImportSource';
import { parseExpenseRows } from '@/lib/import/expenseRows';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 800;

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
        'Could not read a table from this PDF. Export as CSV or Excel, or ensure the file has comma-, tab-, or semicolon-separated columns.',
      image422:
        'Could not read a table from this image. Use a clear screenshot with visible column headers (comma, tab, or semicolon separated), or import CSV/Excel instead.',
      unsupported400: 'Unsupported format. Use .csv, .xlsx, .xls, .pdf, or an image (.png, .jpg, .webp, .gif, .bmp).',
    });
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status });
    }
    const tab = parsed.tab;

    if (tab.rows.length > MAX_ROWS) {
      return NextResponse.json({ success: false, error: `Too many rows (max ${MAX_ROWS}).` }, { status: 400 });
    }

    const { ok, errors: parseErrors } = parseExpenseRows(tab);
    const rowErrors = [...parseErrors];
    let imported = 0;

    for (const row of ok) {
      const { error } = await supabase.from('expenses').insert({
        owner_id: ctx.workspaceOwnerId,
        amount: row.amount,
        currency: row.currency,
        category: row.category,
        description: row.description,
        expense_date: row.expenseDate,
        source: 'import',
        updated_at: new Date().toISOString(),
      });
      if (error) {
        rowErrors.push(`${row.description ?? row.expenseDate}: ${error.message}`);
        continue;
      }
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skipped: ok.length - imported,
        parseErrors: rowErrors.slice(0, 50),
        totalRows: tab.rows.length,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Import failed.' }, { status: 500 });
  }
}
