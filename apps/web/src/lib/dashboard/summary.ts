import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardActivity, DashboardInvoice, DashboardSummary } from './types';

function coerceStatus(v: unknown): DashboardInvoice['status'] {
  const s = String(v ?? 'draft').toLowerCase();
  if (s === 'draft' || s === 'sent' || s === 'partial' || s === 'paid' || s === 'overdue' || s === 'cancelled') {
    return s;
  }
  return 'draft';
}

function utcMonthRange(ref = new Date()) {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  const prevStart = new Date(Date.UTC(y, m - 1, 1));
  const prevEnd = start;
  const toDate = (d: Date) => d.toISOString().slice(0, 10);
  return {
    monthStart: toDate(start),
    monthEndExclusive: toDate(end),
    prevMonthStart: toDate(prevStart),
    prevMonthEndExclusive: toDate(prevEnd),
  };
}

function dayLabel(isoDate: string) {
  const [y, mo, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export async function getDashboardSummary(
  supabase: SupabaseClient,
  workspaceOwnerId: string | null
): Promise<DashboardSummary> {
  const { monthStart, monthEndExclusive, prevMonthStart, prevMonthEndExclusive } = utcMonthRange();
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

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
      sent_at,
      client:clients(name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(2500);

  if (workspaceOwnerId) {
    invQuery = invQuery.eq('owner_id', workspaceOwnerId);
  }

  let { data: invRows, error: invErr } = await invQuery;
  if (invErr && workspaceOwnerId) {
    const msg = String((invErr as any).message ?? '').toLowerCase();
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
      sent_at,
      client:clients(name)
    `
        )
        .order('created_at', { ascending: false })
        .limit(2500);
      invRows = fb.data;
      invErr = fb.error;
    }
  }
  if (invErr) throw invErr;

  const invoices: DashboardInvoice[] = (invRows ?? []).map((r: any) => ({
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
  const invoiceIds = new Set(invoices.map((i) => i.id));

  let payQuery = supabase
    .from('payments')
    .select(
      `
      id,
      amount,
      currency,
      status,
      payment_date,
      created_at,
      invoice_id,
      invoices!inner(invoice_number, owner_id, client:clients(name))
    `
    )
    .order('payment_date', { ascending: false })
    .limit(4000);

  if (workspaceOwnerId) {
    payQuery = payQuery.eq('invoices.owner_id', workspaceOwnerId);
  }

  let { data: payRows, error: payErr } = await payQuery;
  if (payErr && workspaceOwnerId) {
    const msg = String((payErr as any).message ?? '').toLowerCase();
    if (msg.includes('owner_id') || msg.includes('column')) {
      const fb = await supabase
        .from('payments')
        .select(
          `
      id,
      amount,
      currency,
      status,
      payment_date,
      created_at,
      invoice_id,
      invoices(invoice_number, owner_id, client:clients(name))
    `
        )
        .order('payment_date', { ascending: false })
        .limit(4000);
      payRows = fb.data;
      payErr = fb.error;
    }
  }
  if (payErr) throw payErr;

  type PayRow = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_date: string;
    created_at: string;
    invoice_id: string;
    invoices: {
      invoice_number?: string | null;
      owner_id?: string | null;
      client?: { name?: string | null } | null;
    } | null;
  };

  let payments: PayRow[] = (payRows ?? []).map((p: any) => ({
    id: String(p.id),
    amount: Number(p.amount ?? 0),
    currency: String(p.currency ?? 'ZAR'),
    status: String(p.status ?? ''),
    payment_date: String(p.payment_date ?? '').slice(0, 10),
    created_at: String(p.created_at ?? ''),
    invoice_id: String(p.invoice_id),
    invoices: p.invoices ?? null,
  }));

  payments = payments.filter((p) => invoiceIds.has(p.invoice_id));
  if (workspaceOwnerId) {
    payments = payments.filter((p) => !p.invoices?.owner_id || String(p.invoices.owner_id) === workspaceOwnerId);
  }

  let invoicedThisMonth = 0;
  let outstandingAmount = 0;
  let outstandingInvoiceCount = 0;
  let overdueAmount = 0;
  let overdueInvoiceCount = 0;

  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue;
    const issue = inv.issue_date;
    if (issue && issue >= monthStart && issue < monthEndExclusive) {
      invoicedThisMonth += inv.total_amount;
    }
    if (inv.balance_amount > 0) {
      outstandingAmount += inv.balance_amount;
      outstandingInvoiceCount += 1;
      const due = inv.due_date;
      if (due && due < todayISO) {
        overdueAmount += inv.balance_amount;
        overdueInvoiceCount += 1;
      }
    }
  }

  const isCompleted = (s: string) => s.toLowerCase() === 'completed';

  let paidThisMonth = 0;
  let paidPrevMonth = 0;
  let paidLifetime = 0;
  const clientPaidMap = new Map<string, number>();

  for (const p of payments) {
    if (!isCompleted(p.status)) continue;
    paidLifetime += p.amount;
    const pd = p.payment_date;
    if (pd >= monthStart && pd < monthEndExclusive) {
      paidThisMonth += p.amount;
    }
    if (pd >= prevMonthStart && pd < prevMonthEndExclusive) {
      paidPrevMonth += p.amount;
    }
    const clientName = p.invoices?.client?.name?.trim() || 'Unknown client';
    clientPaidMap.set(clientName, (clientPaidMap.get(clientName) ?? 0) + p.amount);
  }

  const collectionMomPercent =
    paidPrevMonth > 0 ? ((paidThisMonth - paidPrevMonth) / paidPrevMonth) * 100 : paidThisMonth > 0 ? 100 : null;

  let topPayingClient: { name: string; totalPaid: number } | null = null;
  for (const [name, totalPaid] of clientPaidMap) {
    if (!topPayingClient || totalPaid > topPayingClient.totalPaid) {
      topPayingClient = { name, totalPaid };
    }
  }
  if (topPayingClient && topPayingClient.totalPaid <= 0) topPayingClient = null;

  const days = 90;
  const revenueByDayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    revenueByDayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const p of payments) {
    if (!isCompleted(p.status)) continue;
    const day = p.payment_date.slice(0, 10);
    if (revenueByDayMap.has(day)) {
      revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + p.amount);
    }
  }
  const revenueByDay = [...revenueByDayMap.entries()].map(([date, amount]) => ({
    date,
    label: dayLabel(date),
    amount,
  }));

  const paidVsUnpaid = [
    { key: 'paid' as const, name: 'Collected', value: Math.round(paidLifetime * 100) / 100 },
    { key: 'unpaid' as const, name: 'Outstanding', value: Math.round(outstandingAmount * 100) / 100 },
  ];

  const invoiceSent: DashboardActivity[] = (invRows ?? [])
    .map((r: any) => {
      const sentAt = r.sent_at as string | null | undefined;
      if (!sentAt) return null;
      return {
        type: 'invoice_sent' as const,
        at: sentAt,
        invoiceId: String(r.id),
        invoiceNumber: r.invoice_number ? String(r.invoice_number) : null,
        clientName: r.client?.name ?? null,
      };
    })
    .filter(Boolean) as DashboardActivity[];

  invoiceSent.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const paymentActs: DashboardActivity[] = payments.map((p) => ({
    type: 'payment_received' as const,
    at: p.created_at || `${p.payment_date}T12:00:00.000Z`,
    invoiceId: p.invoice_id,
    invoiceNumber: p.invoices?.invoice_number ? String(p.invoices.invoice_number) : null,
    clientName: p.invoices?.client?.name ?? null,
    amount: p.amount,
    currency: p.currency,
  }));
  paymentActs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  let reminderRows: any[] = [];
  let rq = supabase
    .from('reminder_events')
    .select(
      `
      id,
      channel,
      sent_at,
      invoice_id,
      invoices!inner(invoice_number, owner_id, client:clients(name))
    `
    )
    .order('sent_at', { ascending: false })
    .limit(25);

  if (workspaceOwnerId) {
    rq = rq.eq('invoices.owner_id', workspaceOwnerId);
  }
  const { data: remData, error: remErr } = await rq;
  if (remErr) {
    const m = String((remErr as any).message ?? '').toLowerCase();
    if (!m.includes('relation') && !m.includes('does not exist') && !m.includes('schema cache')) {
      // Table may be missing in older DBs; ignore silently for activity feed.
    }
  } else {
    reminderRows = remData ?? [];
  }

  const reminderActs: DashboardActivity[] = (reminderRows ?? []).map((row: any) => ({
    type: 'reminder_sent' as const,
    at: String(row.sent_at),
    invoiceId: String(row.invoice_id),
    invoiceNumber: row.invoices?.invoice_number ? String(row.invoices.invoice_number) : null,
    clientName: row.invoices?.client?.name ?? null,
    channel: String(row.channel ?? ''),
  }));

  const activity: DashboardActivity[] = [
    ...invoiceSent.slice(0, 12),
    ...paymentActs.slice(0, 15),
    ...reminderActs.slice(0, 12),
  ];
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const activityTop = activity.slice(0, 25);

  return {
    currency,
    overview: {
      invoicedThisMonth,
      outstandingAmount,
      outstandingInvoiceCount,
      overdueAmount,
      overdueInvoiceCount,
      paidThisMonth,
    },
    revenueByDay,
    paidVsUnpaid,
    insights: {
      collectionMomPercent,
      topPayingClient,
    },
    activity: activityTop,
    recentInvoices: invoices.slice(0, 15),
  };
}

export function buildDemoDashboardSummary(): DashboardSummary {
  const currency = 'ZAR';
  const now = new Date();
  const revenueByDay = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (89 - i)));
    const date = d.toISOString().slice(0, 10);
    const amount = i % 11 === 0 ? 4200 + i * 30 : i % 7 === 0 ? 1800 : 0;
    return { date, label: dayLabel(date), amount };
  });

  const recentInvoices: DashboardInvoice[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      invoice_number: 'TI-00041',
      client_name: 'Acme Studio',
      status: 'partial',
      issue_date: now.toISOString().slice(0, 10),
      due_date: now.toISOString().slice(0, 10),
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
      issue_date: now.toISOString().slice(0, 10),
      due_date: now.toISOString().slice(0, 10),
      currency,
      total_amount: 8400,
      paid_amount: 0,
      balance_amount: 8400,
    },
  ];

  return {
    currency,
    overview: {
      invoicedThisMonth: 45200,
      outstandingAmount: 20900,
      outstandingInvoiceCount: 4,
      overdueAmount: 6100,
      overdueInvoiceCount: 1,
      paidThisMonth: 31800,
    },
    revenueByDay,
    paidVsUnpaid: [
      { key: 'paid', name: 'Collected', value: 128400 },
      { key: 'unpaid', name: 'Outstanding', value: 20900 },
    ],
    insights: {
      collectionMomPercent: 12.4,
      topPayingClient: { name: 'Pulse Media', totalPaid: 45800 },
    },
    activity: [
      {
        type: 'payment_received',
        at: new Date(now.getTime() - 3600e3).toISOString(),
        invoiceId: 'demo',
        invoiceNumber: 'TI-00045',
        clientName: 'Pulse Media',
        amount: 15800,
        currency,
      },
      {
        type: 'invoice_sent',
        at: new Date(now.getTime() - 7200e3).toISOString(),
        invoiceId: 'demo2',
        invoiceNumber: 'TI-00046',
        clientName: 'Evergreen Consulting',
      },
      {
        type: 'reminder_sent',
        at: new Date(now.getTime() - 86400e3).toISOString(),
        invoiceId: 'demo3',
        invoiceNumber: 'TI-00044',
        clientName: 'Sky & Co',
        channel: 'email',
      },
    ],
    recentInvoices,
  };
}
