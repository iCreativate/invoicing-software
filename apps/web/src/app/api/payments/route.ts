import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { canRecordPayments } from '@/lib/permissions/team';
import { insertPaymentAndReconcile } from '@/lib/payments/recalculateInvoiceFromPayments';

const ALLOWED_METHODS = new Set([
  'bank_transfer',
  'card',
  'cash',
  'cheque',
  'mobile_money',
  'paystack',
  'flutterwave',
]);

function monthBoundsUtc(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function currentMonthUtc() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month')?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 200), 1), 500);

    const selectCols = `
      id,
      invoice_id,
      amount,
      currency,
      method,
      status,
      payment_date,
      notes,
      provider,
      external_reference,
      created_at,
      invoices!inner(
        owner_id,
        invoice_number,
        issue_date,
        client:clients(name)
      )
    `;

    let q = supabase
      .from('payments')
      .select(selectCols)
      .eq('invoices.owner_id', ctx.workspaceOwnerId)
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (month) {
      const b = monthBoundsUtc(month);
      if (b) {
        q = q.gte('payment_date', b.start).lte('payment_date', b.end);
      }
    }

    let { data, error }: { data: any; error: any } = await q;

    if (error) {
      const msg = String((error as any).message ?? '').toLowerCase();
      if (msg.includes('provider') || msg.includes('external_reference') || msg.includes('column')) {
        const selectLegacy = `
      id,
      invoice_id,
      amount,
      currency,
      method,
      status,
      payment_date,
      notes,
      created_at,
      invoices!inner(
        owner_id,
        invoice_number,
        issue_date,
        client:clients(name)
      )
    `;
        let q2 = supabase
          .from('payments')
          .select(selectLegacy)
          .eq('invoices.owner_id', ctx.workspaceOwnerId)
          .order('payment_date', { ascending: false })
          .limit(limit);
        if (month) {
          const b = monthBoundsUtc(month);
          if (b) q2 = q2.gte('payment_date', b.start).lte('payment_date', b.end);
        }
        const fb = await q2;
        data = fb.data;
        error = fb.error;
      } else if (msg.includes('owner_id')) {
        let q2 = supabase.from('payments').select(selectCols).order('payment_date', { ascending: false }).limit(limit);
        if (month) {
          const b = monthBoundsUtc(month);
          if (b) q2 = q2.gte('payment_date', b.start).lte('payment_date', b.end);
        }
        const fb = await q2;
        data = fb.data;
        error = fb.error;
      }
    }

    if (error) throw error;

    const payments = (data ?? []).map((p: any) => ({
      id: String(p.id),
      invoice_id: String(p.invoice_id),
      invoice_number: p.invoices?.invoice_number ? String(p.invoices.invoice_number) : null,
      client_name: p.invoices?.clients?.name ? String(p.invoices.clients.name) : null,
      issue_date: p.invoices?.issue_date ? String(p.invoices.issue_date).slice(0, 10) : null,
      amount: Number(p.amount ?? 0),
      currency: String(p.currency ?? 'ZAR'),
      method: String(p.method ?? 'bank_transfer'),
      status: String(p.status ?? 'completed'),
      payment_date: String(p.payment_date ?? '').slice(0, 10),
      notes: p.notes ? String(p.notes) : null,
      provider: p.provider != null ? String(p.provider) : null,
      external_reference: p.external_reference != null ? String(p.external_reference) : null,
      created_at: p.created_at ? String(p.created_at) : null,
    }));

    const cm = currentMonthUtc();
    const bounds = monthBoundsUtc(cm);
    let monthlyIncome = 0;
    let monthlyCurrency = 'ZAR';
    let avgDaysToFirstPayment: number | null = null;

    const statsSelect = `
      id,
      invoice_id,
      amount,
      currency,
      payment_date,
      status,
      invoices!inner(owner_id,issue_date)
    `;

    let statsQ = supabase
      .from('payments')
      .select(statsSelect)
      .eq('invoices.owner_id', ctx.workspaceOwnerId)
      .eq('status', 'completed')
      .limit(3000);

    let { data: statsRows, error: statsErr } = await statsQ;
    if (statsErr) {
      const m = String((statsErr as any).message ?? '').toLowerCase();
      if (m.includes('owner_id')) {
        const fb = await supabase.from('payments').select(statsSelect).eq('status', 'completed').limit(3000);
        statsRows = fb.data;
        statsErr = fb.error;
      }
    }

    if (!statsErr && statsRows?.length) {
      const byInv = new Map<string, { issue: string; firstPay: string }>();
      for (const row of statsRows as any[]) {
        const iid = String(row.invoice_id);
        const pd = String(row.payment_date ?? '').slice(0, 10);
        const issue = String(row.invoices?.issue_date ?? '').slice(0, 10);
        if (!pd || !issue) continue;
        const cur = byInv.get(iid);
        if (!cur || pd < cur.firstPay) {
          byInv.set(iid, { issue, firstPay: pd });
        }
      }

      const diffs: number[] = [];
      for (const { issue, firstPay } of byInv.values()) {
        const a = new Date(issue + 'T12:00:00.000Z').getTime();
        const b = new Date(firstPay + 'T12:00:00.000Z').getTime();
        if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
          diffs.push(Math.round((b - a) / 86400000));
        }
      }
      if (diffs.length) {
        avgDaysToFirstPayment = Math.round((diffs.reduce((s, d) => s + d, 0) / diffs.length) * 10) / 10;
      }

      if (bounds) {
        for (const row of statsRows as any[]) {
          const oid = row.invoices?.owner_id;
          if (ctx.workspaceOwnerId && oid && String(oid) !== ctx.workspaceOwnerId) continue;
          const pd = String(row.payment_date ?? '').slice(0, 10);
          if (pd >= bounds.start && pd <= bounds.end) {
            monthlyIncome += Number(row.amount ?? 0);
            if (row.currency) monthlyCurrency = String(row.currency);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      payments,
      analytics: {
        month: cm,
        monthlyIncome,
        monthlyCurrency,
        avgDaysToFirstPayment,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Failed to load payments.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    if (!canRecordPayments(ctx.permission)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to record payments.' },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });

    const invoiceId = String(body.invoice_id ?? body.invoiceId ?? '').trim();
    const amount = Number(body.amount);
    const currency = String(body.currency ?? 'ZAR').trim() || 'ZAR';
    const methodRaw = String(body.method ?? 'bank_transfer').toLowerCase();
    const paymentDate = String(body.payment_date ?? body.paymentDate ?? '').trim();
    const notes = body.notes != null ? String(body.notes) : null;
    const status = body.status != null ? String(body.status).toLowerCase() : 'completed';
    const provider = body.provider != null ? String(body.provider).trim() : null;
    const externalReference =
      body.external_reference != null
        ? String(body.external_reference)
        : body.externalReference != null
          ? String(body.externalReference)
          : null;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'invoice_id is required.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'amount must be a positive number.' }, { status: 400 });
    }
    if (!paymentDate || paymentDate.length < 8) {
      return NextResponse.json({ success: false, error: 'payment_date is required (YYYY-MM-DD).' }, { status: 400 });
    }
    if (!ALLOWED_METHODS.has(methodRaw)) {
      return NextResponse.json(
        { success: false, error: `method must be one of: ${[...ALLOWED_METHODS].join(', ')}.` },
        { status: 400 }
      );
    }
    const allowedStatus = new Set(['pending', 'processing', 'completed', 'failed', 'refunded']);
    if (!allowedStatus.has(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status.' }, { status: 400 });
    }

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id,owner_id')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invErr) throw invErr;
    if (!inv) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }
    const ownerId = (inv as any).owner_id != null ? String((inv as any).owner_id) : null;
    if (ctx.workspaceOwnerId && ownerId && ownerId !== ctx.workspaceOwnerId) {
      return NextResponse.json({ success: false, error: 'Invoice not in this workspace.' }, { status: 403 });
    }

    const { paymentId } = await insertPaymentAndReconcile(supabase, {
      invoiceId,
      amount,
      currency,
      method: methodRaw,
      paymentDate,
      notes,
      status,
      provider: provider || null,
      externalReference: externalReference || null,
    });

    return NextResponse.json({ success: true, payment_id: paymentId });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Failed to record payment.' },
      { status: 500 }
    );
  }
}
