import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';

function canViewReports(permission: string) {
  const p = String(permission ?? 'member').toLowerCase();
  return ['owner', 'admin', 'billing', 'member', 'viewer'].includes(p);
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function monthKey(isoDate: string) {
  return String(isoDate ?? '').slice(0, 7);
}

function eachMonthInRange(from: string, to: string): string[] {
  const out: string[] = [];
  let y = parseInt(from.slice(0, 4), 10);
  let m = parseInt(from.slice(5, 7), 10);
  const endY = parseInt(to.slice(0, 4), 10);
  const endM = parseInt(to.slice(5, 7), 10);
  if (!y || !m || !endY || !endM) return out;
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function yearKey(ym: string) {
  return ym.slice(0, 4);
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    if (!canViewReports(ctx.permission)) {
      return NextResponse.json({ success: false, error: 'You do not have access to reports.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dr = defaultDateRange();
    let from = searchParams.get('from')?.trim().slice(0, 10) || dr.from;
    let to = searchParams.get('to')?.trim().slice(0, 10) || dr.to;
    if (from > to) {
      const t = from;
      from = to;
      to = t;
    }
    const currencyFilter = searchParams.get('currency')?.trim().toUpperCase() || null;

    const invSelect = `
      id,
      owner_id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      subtotal_amount,
      tax_amount,
      total_amount,
      paid_amount,
      balance_amount,
      client_id,
      client:clients(name)
    `;

    let invQ = supabase
      .from('invoices')
      .select(invSelect)
      .eq('owner_id', ctx.workspaceOwnerId)
      .gte('issue_date', from)
      .lte('issue_date', to)
      .order('issue_date', { ascending: true });

    let { data: invoices, error: invErr } = await invQ;
    if (invErr) {
      const msg = String((invErr as any).message ?? '').toLowerCase();
      if (msg.includes('owner_id')) {
        const fb = await supabase
          .from('invoices')
          .select(invSelect)
          .gte('issue_date', from)
          .lte('issue_date', to)
          .order('issue_date', { ascending: true });
        invoices = (fb.data ?? []).filter((r: any) => String(r.owner_id ?? '') === ctx.workspaceOwnerId);
        invErr = fb.error;
      }
    }
    if (invErr) throw invErr;

    let rows = (invoices ?? []) as any[];
    if (currencyFilter) {
      rows = rows.filter((r) => String(r.currency ?? 'ZAR').toUpperCase() === currencyFilter);
    }

    const countsForRevenue = new Set(['sent', 'partial', 'paid', 'overdue']);

    const monthlyInvoiced = new Map<string, number>();
    const clientAgg = new Map<
      string,
      { client_id: string; name: string; invoiced: number; paid_on_invoices: number; invoice_count: number }
    >();

    let taxSubtotal = 0;
    let taxTotal = 0;
    let taxInvoiceCount = 0;

    for (const r of rows) {
      const st = String(r.status ?? '').toLowerCase();
      if (st === 'draft' || st === 'cancelled') continue;

      const cur = String(r.currency ?? 'ZAR');
      const mk = monthKey(String(r.issue_date ?? ''));
      const total = Number(r.total_amount ?? 0);
      const paid = Number(r.paid_amount ?? 0);

      if (countsForRevenue.has(st) && mk.length === 7) {
        monthlyInvoiced.set(mk, (monthlyInvoiced.get(mk) ?? 0) + total);
      }

      const cid = String(r.client_id ?? '');
      const cname = r.client?.name ? String(r.client.name) : 'Unknown';
      if (cid) {
        const curA = clientAgg.get(cid) ?? {
          client_id: cid,
          name: cname,
          invoiced: 0,
          paid_on_invoices: 0,
          invoice_count: 0,
        };
        curA.invoiced += total;
        curA.paid_on_invoices += paid;
        curA.invoice_count += 1;
        curA.name = cname;
        clientAgg.set(cid, curA);
      }

      if (countsForRevenue.has(st)) {
        taxSubtotal += Number(r.subtotal_amount ?? 0);
        taxTotal += Number(r.tax_amount ?? 0);
        taxInvoiceCount += 1;
      }
    }

    const paySelect = `
      amount,
      payment_date,
      currency,
      status,
      invoices!inner(owner_id)
    `;

    let payQ = supabase
      .from('payments')
      .select(paySelect)
      .eq('invoices.owner_id', ctx.workspaceOwnerId)
      .eq('status', 'completed')
      .gte('payment_date', from)
      .lte('payment_date', to);

    let { data: payments, error: payErr }: { data: any[] | null; error: any } = await payQ;
    if (payErr) {
      const msg = String((payErr as any).message ?? '').toLowerCase();
      if (msg.includes('owner_id')) {
        const fb = await supabase
          .from('payments')
          .select('amount,payment_date,currency,status,invoice_id')
          .eq('status', 'completed')
          .gte('payment_date', from)
          .lte('payment_date', to);
        const invIds = [...new Set((fb.data ?? []).map((p: any) => String(p.invoice_id)))];
        if (invIds.length) {
          const { data: invOwners } = await supabase.from('invoices').select('id,owner_id').in('id', invIds);
          const allowed = new Set(
            (invOwners ?? []).filter((x: any) => String(x.owner_id) === ctx.workspaceOwnerId).map((x: any) => String(x.id))
          );
          payments = (fb.data ?? []).filter((p: any) => allowed.has(String(p.invoice_id)));
        } else {
          payments = [];
        }
        payErr = null;
      }
    }
    if (payErr) throw payErr;

    const monthlyCollected = new Map<string, number>();
    for (const p of (payments ?? []) as any[]) {
      const cur = String(p.currency ?? 'ZAR');
      if (currencyFilter && cur.toUpperCase() !== currencyFilter) continue;
      const mk = monthKey(String(p.payment_date ?? ''));
      if (mk.length === 7) {
        monthlyCollected.set(mk, (monthlyCollected.get(mk) ?? 0) + Number(p.amount ?? 0));
      }
    }

    const monthKeys = eachMonthInRange(from, to);
    const revenue_monthly = monthKeys.map((period) => ({
      period,
      invoiced: monthlyInvoiced.get(period) ?? 0,
      collected: monthlyCollected.get(period) ?? 0,
    }));

    const yearlyMap = new Map<string, { invoiced: number; collected: number }>();
    for (const m of revenue_monthly) {
      const y = yearKey(m.period);
      const cur = yearlyMap.get(y) ?? { invoiced: 0, collected: 0 };
      cur.invoiced += m.invoiced;
      cur.collected += m.collected;
      yearlyMap.set(y, cur);
    }
    const revenue_yearly = [...yearlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, v]) => ({ year, invoiced: v.invoiced, collected: v.collected }));

    const top_clients = [...clientAgg.values()]
      .sort((a, b) => b.invoiced - a.invoiced)
      .slice(0, 20)
      .map((c) => ({
        client_id: c.client_id,
        client_name: c.name,
        invoiced: c.invoiced,
        paid_on_invoices: c.paid_on_invoices,
        invoice_count: c.invoice_count,
      }));

    const outSelect = `
      id,
      owner_id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      total_amount,
      balance_amount,
      client:clients(name)
    `;

    let outQ = supabase
      .from('invoices')
      .select(outSelect)
      .eq('owner_id', ctx.workspaceOwnerId)
      .gt('balance_amount', 0)
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'draft')
      .order('due_date', { ascending: true })
      .limit(200);

    let { data: outstandingRows, error: outErr } = await outQ;
    if (outErr) {
      const msg = String((outErr as any).message ?? '').toLowerCase();
      if (msg.includes('owner_id')) {
        const fb = await supabase
          .from('invoices')
          .select(outSelect)
          .gt('balance_amount', 0)
          .not('status', 'eq', 'cancelled')
          .not('status', 'eq', 'draft')
          .order('due_date', { ascending: true })
          .limit(200);
        outstandingRows = (fb.data ?? []).filter((r: any) => String(r.owner_id ?? '') === ctx.workspaceOwnerId);
        outErr = fb.error;
      }
    }
    if (outErr) throw outErr;

    let outstanding = (outstandingRows ?? []).map((r: any) => ({
      invoice_id: String(r.id),
      invoice_number: String(r.invoice_number ?? ''),
      client_name: r.client?.name ? String(r.client.name) : null,
      status: String(r.status ?? ''),
      issue_date: String(r.issue_date ?? '').slice(0, 10),
      due_date: String(r.due_date ?? '').slice(0, 10),
      currency: String(r.currency ?? 'ZAR'),
      total_amount: Number(r.total_amount ?? 0),
      balance_amount: Number(r.balance_amount ?? 0),
    }));
    if (currencyFilter) {
      outstanding = outstanding.filter((r) => r.currency.toUpperCase() === currencyFilter);
    }

    const primaryCurrency =
      currencyFilter ||
      rows[0]?.currency ||
      (outstanding[0]?.currency ?? null) ||
      ((payments ?? [])[0] as any)?.currency ||
      'ZAR';

    return NextResponse.json({
      success: true,
      data: {
        range: { from, to },
        currency_filter: currencyFilter,
        mixed_currency: !currencyFilter,
        primary_currency_hint: String(primaryCurrency),
        revenue_monthly,
        revenue_yearly,
        top_clients,
        outstanding,
        tax_summary: {
          invoice_count: taxInvoiceCount,
          taxable_subtotal: taxSubtotal,
          tax_amount: taxTotal,
        },
        totals_in_range: {
          invoiced: rows.filter((r) => countsForRevenue.has(String(r.status ?? '').toLowerCase())).reduce((s, r) => s + Number(r.total_amount ?? 0), 0),
          collected: [...monthlyCollected.values()].reduce((a, b) => a + b, 0),
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Reports failed.' }, { status: 500 });
  }
}
