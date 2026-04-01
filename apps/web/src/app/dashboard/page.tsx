import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import DashboardClient, { type DashboardData, type DashboardInvoice, type TrendPoint } from './DashboardClient';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const demo = cookieStore.get('ti_demo')?.value === '1';

  if (demo) {
    const currency = 'ZAR';
    const now = new Date();
    const mkDate = (offsetDays: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().slice(0, 10);
    };

    const recentInvoices: DashboardInvoice[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        invoice_number: 'TI-00041',
        client_name: 'Acme Studio',
        status: 'partial',
        issue_date: mkDate(-12),
        due_date: mkDate(-2),
        currency,
        total_amount: 12500,
        paid_amount: 5000,
        balance_amount: 7500,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        invoice_number: 'TI-00042',
        client_name: 'Brightline Logistics',
        status: 'sent',
        issue_date: mkDate(-7),
        due_date: mkDate(7),
        currency,
        total_amount: 8400,
        paid_amount: 0,
        balance_amount: 8400,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        invoice_number: 'TI-00043',
        client_name: 'Northwind Café',
        status: 'paid',
        issue_date: mkDate(-20),
        due_date: mkDate(-5),
        currency,
        total_amount: 3200,
        paid_amount: 3200,
        balance_amount: 0,
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        invoice_number: 'TI-00044',
        client_name: 'Sky & Co',
        status: 'overdue',
        issue_date: mkDate(-18),
        due_date: mkDate(-3),
        currency,
        total_amount: 6100,
        paid_amount: 0,
        balance_amount: 6100,
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        invoice_number: 'TI-00045',
        client_name: 'Pulse Media',
        status: 'paid',
        issue_date: mkDate(-3),
        due_date: mkDate(10),
        currency,
        total_amount: 15800,
        paid_amount: 15800,
        balance_amount: 0,
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        invoice_number: 'TI-00046',
        client_name: 'Evergreen Consulting',
        status: 'sent',
        issue_date: mkDate(-1),
        due_date: mkDate(14),
        currency,
        total_amount: 4500,
        paid_amount: 0,
        balance_amount: 4500,
      },
    ];

    const outstanding = recentInvoices.reduce((s, i) => s + (i.balance_amount > 0 ? i.balance_amount : 0), 0);
    const overdue = recentInvoices.filter((i) => i.status === 'overdue' || (i.balance_amount > 0 && i.due_date && new Date(i.due_date) < now));
    const overdueCount = overdue.length;
    const overdueValue = overdue.reduce((s, i) => s + i.balance_amount, 0);

    // Simple demo revenue values
    const revenueMonth = 15800 + 3200;
    const revenueYtd = 15800 + 3200 + 27500;

    const trend: TrendPoint[] = Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (13 - idx));
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const spike = idx === 10 ? 15800 : idx === 4 ? 3200 : 0;
      return { date: label, revenue: spike, outstanding };
    });

    const data: DashboardData = {
      currency,
      revenueMonth,
      revenueYtd,
      outstanding,
      overdueCount,
      overdueValue,
      recentInvoices,
      trend,
    };

    return <DashboardClient userEmail="demo@timelyinvoices.app" data={data} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ws = await getWorkspaceContext(supabase);

  // Pull a concise invoice slice and compute dashboard metrics server-side (fast initial paint)
  let invQuery = supabase
    .from('invoices')
    .select(
      `
      id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      total_amount,
      paid_amount,
      balance_amount,
      paid_date,
      client:clients(name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (ws) {
    invQuery = invQuery.eq('owner_id', ws.workspaceOwnerId);
  }

  let { data: rows, error: invListErr } = await invQuery;
  if (invListErr && ws) {
    const msg = String((invListErr as any).message ?? '').toLowerCase();
    if (msg.includes('owner_id') || msg.includes('column')) {
      const fb = await supabase
        .from('invoices')
        .select(
          `
      id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      total_amount,
      paid_amount,
      balance_amount,
      paid_date,
      client:clients(name)
    `
        )
        .order('created_at', { ascending: false })
        .limit(200);
      rows = fb.data;
      invListErr = fb.error;
    }
  }
  if (invListErr) throw invListErr;

  const coerceStatus = (v: unknown): DashboardInvoice['status'] => {
    const s = String(v ?? 'draft').toLowerCase();
    if (s === 'draft' || s === 'sent' || s === 'partial' || s === 'paid' || s === 'overdue' || s === 'cancelled') {
      return s;
    }
    return 'draft';
  };

  const invoices: DashboardInvoice[] = (rows ?? []).map((r: any) => ({
    id: String(r.id),
    invoice_number: String(r.invoice_number ?? ''),
    client_name: r.client?.name ?? null,
    status: coerceStatus(r.status),
    issue_date: r.issue_date ? String(r.issue_date) : null,
    due_date: r.due_date ? String(r.due_date) : null,
    currency: String(r.currency ?? 'ZAR'),
    total_amount: Number(r.total_amount ?? 0),
    paid_amount: Number(r.paid_amount ?? 0),
    balance_amount: Number(r.balance_amount ?? 0),
  }));

  const currency = invoices.find((i) => i.currency)?.currency ?? 'ZAR';
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const toDate = (iso: string | null | undefined) => (iso ? new Date(iso) : null);

  let revenueMonth = 0;
  let revenueYtd = 0;
  let outstanding = 0;
  let overdueCount = 0;
  let overdueValue = 0;

  for (const inv of invoices) {
    const paidDate = toDate((rows as any)?.find?.((x: any) => String(x.id) === inv.id)?.paid_date ?? null);
    const issueDate = toDate(inv.issue_date);
    const revDate = paidDate ?? issueDate;

    if (inv.status === 'paid' && revDate) {
      if (revDate >= startOfMonth) revenueMonth += inv.total_amount;
      if (revDate >= startOfYear) revenueYtd += inv.total_amount;
    }

    if (inv.balance_amount > 0) {
      outstanding += inv.balance_amount;
      const due = toDate(inv.due_date);
      if (due && due < now) {
        overdueCount += 1;
        overdueValue += inv.balance_amount;
      }
    }
  }

  const recentInvoices = invoices.slice(0, 6);

  // Trend (14 days): revenue + outstanding snapshots (client renders chart)
  const trend: TrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    // Revenue: sum of paid invoices on/after day? (simple approximation: paid invoices on that day)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    let dayRevenue = 0;
    for (const inv of invoices) {
      if (inv.status !== 'paid') continue;
      const paidDate = toDate((rows as any)?.find?.((x: any) => String(x.id) === inv.id)?.paid_date ?? null) ?? toDate(inv.issue_date);
      if (paidDate && paidDate >= dayStart && paidDate < dayEnd) dayRevenue += inv.total_amount;
    }

    // Outstanding snapshot: unpaid balances due on/after today? (still outstanding regardless of due)
    const snapshotOutstanding = outstanding;
    trend.push({ date: key, revenue: dayRevenue, outstanding: snapshotOutstanding });
  }

  const data: DashboardData = {
    currency,
    revenueMonth,
    revenueYtd,
    outstanding,
    overdueCount,
    overdueValue,
    recentInvoices,
    trend,
  };

  return <DashboardClient userEmail={user?.email ?? null} data={data} />;
}

