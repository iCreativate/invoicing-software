import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DashboardActionItem,
  DashboardActivity,
  DashboardBusinessPulse,
  DashboardInvoice,
  DashboardSummary,
} from './types';

function coerceStatus(v: unknown): DashboardInvoice['status'] {
  const s = String(v ?? 'draft').toLowerCase();
  if (
    s === 'draft' ||
    s === 'sent' ||
    s === 'viewed' ||
    s === 'partial' ||
    s === 'paid' ||
    s === 'overdue' ||
    s === 'cancelled'
  ) {
    return s;
  }
  return 'draft';
}

function buildAiCashflowInsight(args: {
  overdueAmount: number;
  overdueInvoiceCount: number;
  outstandingAmount: number;
  paidThisMonth: number;
  expensesThisMonth: number;
  collectionMomPercent: number | null;
}): string {
  const { overdueAmount, overdueInvoiceCount, outstandingAmount, paidThisMonth, expensesThisMonth, collectionMomPercent } =
    args;
  const sa =
    'South African SMEs: keep proof of EFTs for SARS and reconcile VAT output on taxable supplies.';
  if (overdueAmount > 0 && overdueInvoiceCount > 0) {
    return `${overdueInvoiceCount} overdue invoice(s) carry exposure. Chase the largest balances first, then tighten payment terms on repeat late payers. ${sa}`;
  }
  if (outstandingAmount > paidThisMonth * 2 && outstandingAmount > 0) {
    return `Outstanding receivables are elevated vs cash collected this month. Consider scheduled reminders and SnapScan / payment links on every invoice. ${sa}`;
  }
  if (collectionMomPercent != null && collectionMomPercent < -5) {
    return `Collection pace dipped vs last month. Review clients approaching 30+ days and send a friendly reminder before invoices age into VAT complications. ${sa}`;
  }
  if (paidThisMonth > 0 && expensesThisMonth > 0 && paidThisMonth >= expensesThisMonth * 1.2) {
    return `Cash collected this month is ahead of recorded expenses — room to reinvest or build a VAT float. ${sa}`;
  }
  return `Your ZAR workspace is building signal. Add expenses with receipts for cleaner P&L and VAT reporting, and keep invoice statuses current. ${sa}`;
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

function addUtcDays(isoDate: string, days: number) {
  const [y, mo, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function buildActionItems(args: {
  overdueAmount: number;
  overdueInvoiceCount: number;
  dueSoonAmount: number;
  dueSoonCount: number;
  viewedUnpaidAmount: number;
  viewedUnpaidCount: number;
  paymentsTodayAmount?: number;
  paymentsTodayCount?: number;
}): DashboardActionItem[] {
  const items: DashboardActionItem[] = [];
  if (args.overdueInvoiceCount > 0) {
    items.push({
      id: 'overdue',
      kind: 'overdue',
      title: `${args.overdueInvoiceCount} overdue invoice${args.overdueInvoiceCount === 1 ? '' : 's'}`,
      amount: Math.round(args.overdueAmount * 100) / 100,
      count: args.overdueInvoiceCount,
      href: '/reminders',
      cta: 'Collect now',
    });
  }
  if (args.dueSoonCount > 0) {
    items.push({
      id: 'due_soon',
      kind: 'due_soon',
      title: `${args.dueSoonCount} invoice${args.dueSoonCount === 1 ? '' : 's'} due within 7 days`,
      amount: Math.round(args.dueSoonAmount * 100) / 100,
      count: args.dueSoonCount,
      href: '/invoices',
      cta: 'Review',
    });
  }
  if (args.viewedUnpaidCount > 0) {
    items.push({
      id: 'viewed_unpaid',
      kind: 'viewed_unpaid',
      title: `${args.viewedUnpaidCount} invoice${args.viewedUnpaidCount === 1 ? '' : 's'} viewed, not paid`,
      amount: Math.round(args.viewedUnpaidAmount * 100) / 100,
      count: args.viewedUnpaidCount,
      href: '/invoices',
      cta: 'Follow up',
    });
  }
  if ((args.paymentsTodayCount ?? 0) > 0) {
    items.push({
      id: 'payments_today',
      kind: 'payments_today',
      title: `${args.paymentsTodayCount} payment${args.paymentsTodayCount === 1 ? '' : 's'} received today`,
      amount: Math.round((args.paymentsTodayAmount ?? 0) * 100) / 100,
      count: args.paymentsTodayCount!,
      href: '/payments',
      cta: 'View payments',
    });
  }
  return items;
}

function buildBusinessPulse(args: {
  overdueAmount: number;
  overdueInvoiceCount: number;
  outstandingAmount: number;
  avgDaysToPay: number | null;
  collectionMomPercent: number | null;
  collectionRatePercent?: number | null;
  avgDaysDelta?: number | null;
  collectionRateDelta?: number | null;
}): DashboardBusinessPulse {
  const { overdueAmount, overdueInvoiceCount, outstandingAmount, avgDaysToPay, collectionMomPercent } = args;
  let health: DashboardBusinessPulse['health'] = 'healthy';
  if (overdueInvoiceCount >= 3 || (outstandingAmount > 0 && overdueAmount / outstandingAmount >= 0.35)) {
    health = 'at_risk';
  } else if (overdueInvoiceCount > 0 || (collectionMomPercent != null && collectionMomPercent < -10)) {
    health = 'watch';
  }

  let headline: string;
  if (health === 'at_risk') {
    headline = 'Collections need attention — overdue balances are elevated.';
  } else if (health === 'watch') {
    headline = 'Cash is workable, but a few invoices need a nudge.';
  } else if (collectionMomPercent != null && collectionMomPercent >= 5) {
    headline = `Revenue is up ${collectionMomPercent.toFixed(1)}% compared to last month.`;
  } else {
    headline = 'Receivables look steady — keep sending and reconciling.';
  }

  return {
    health,
    headline,
    avgDaysToPay: avgDaysToPay != null ? Math.round(avgDaysToPay * 10) / 10 : null,
    avgDaysDelta: args.avgDaysDelta ?? null,
    collectionMomPercent,
    collectionRatePercent: args.collectionRatePercent ?? null,
    collectionRateDelta: args.collectionRateDelta ?? null,
  };
}

export function emptyDashboardSummary(): DashboardSummary {
  return {
    currency: 'ZAR',
    overview: {
      invoicedThisMonth: 0,
      outstandingAmount: 0,
      outstandingInvoiceCount: 0,
      overdueAmount: 0,
      overdueInvoiceCount: 0,
      paidThisMonth: 0,
      paidInvoiceCountThisMonth: 0,
      expensesThisMonth: 0,
    },
    revenueByDay: [],
    paidVsUnpaid: [
      { key: 'paid', name: 'Collected', value: 0 },
      { key: 'unpaid', name: 'Outstanding', value: 0 },
    ],
    monthlyIncomeVsExpense: [],
    aiCashflowInsight: 'No invoice history yet — create and send your first invoice to see cashflow here.',
    insights: { collectionMomPercent: null, topPayingClient: null },
    actionItems: [],
    businessPulse: {
      health: 'healthy',
      headline: 'Workspace is connected. Metrics will appear once invoices are in the database.',
      avgDaysToPay: null,
      avgDaysDelta: null,
      collectionMomPercent: null,
      collectionRatePercent: null,
      collectionRateDelta: null,
    },
    expectedIncoming: 0,
    activity: [],
    recentInvoices: [],
  };
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
  let expectedIncoming = 0;
  let dueSoonAmount = 0;
  let dueSoonCount = 0;
  let viewedUnpaidAmount = 0;
  let viewedUnpaidCount = 0;
  const horizon14 = addUtcDays(todayISO, 14);
  const horizon7 = addUtcDays(todayISO, 7);

  let payDaysSum = 0;
  let payDaysCount = 0;

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
      } else if (due && due >= todayISO && due <= horizon14) {
        expectedIncoming += inv.balance_amount;
        if (due <= horizon7) {
          dueSoonAmount += inv.balance_amount;
          dueSoonCount += 1;
        }
      }
      if (inv.status === 'viewed') {
        viewedUnpaidAmount += inv.balance_amount;
        viewedUnpaidCount += 1;
      }
    }
  }

  for (const r of invRows ?? []) {
    const st = coerceStatus((r as any).status);
    if (st !== 'paid') continue;
    const issue = (r as any).issue_date ? String((r as any).issue_date).slice(0, 10) : null;
    const paid = (r as any).paid_date ? String((r as any).paid_date).slice(0, 10) : null;
    if (!issue || !paid) continue;
    const a = new Date(`${issue}T00:00:00.000Z`).getTime();
    const b = new Date(`${paid}T00:00:00.000Z`).getTime();
    if (Number.isNaN(a) || Number.isNaN(b) || b < a) continue;
    payDaysSum += (b - a) / 86400000;
    payDaysCount += 1;
  }
  const avgDaysToPay = payDaysCount > 0 ? payDaysSum / payDaysCount : null;

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

  let paidInvoiceCountThisMonth = 0;
  for (const r of invRows ?? []) {
    const pd = (r as any).paid_date ? String((r as any).paid_date).slice(0, 10) : null;
    const st = coerceStatus((r as any).status);
    if (st === 'paid' && pd && pd >= monthStart && pd < monthEndExclusive) paidInvoiceCountThisMonth += 1;
  }

  let expensesThisMonth = 0;
  const expenseByMonthKey = new Map<string, number>();
  if (workspaceOwnerId) {
    const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const windowStartIso = windowStart.toISOString().slice(0, 10);
    const { data: exRows, error: exErr } = await supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('owner_id', workspaceOwnerId)
      .gte('expense_date', windowStartIso)
      .lt('expense_date', monthEndExclusive);
    if (!exErr && exRows) {
      for (const row of exRows as any[]) {
        const amt = Number(row.amount ?? 0);
        const ed = String(row.expense_date ?? '').slice(0, 10);
        if (ed.length >= 7) {
          const ymKey = ed.slice(0, 7);
          expenseByMonthKey.set(ymKey, (expenseByMonthKey.get(ymKey) ?? 0) + amt);
        }
        if (ed >= monthStart && ed < monthEndExclusive) expensesThisMonth += amt;
      }
    }
  }

  const monthlyIncomeVsExpense: { label: string; income: number; expense: number }[] = [];
  for (let back = 5; back >= 0; back--) {
    const y = now.getUTCFullYear();
    const mo = now.getUTCMonth() - back;
    const d0 = new Date(Date.UTC(y, mo, 1));
    const d1 = new Date(Date.UTC(y, mo + 1, 1));
    const ms = d0.toISOString().slice(0, 10);
    const me = d1.toISOString().slice(0, 10);
    const ymKey = `${d0.getUTCFullYear()}-${String(d0.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = d0.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    let income = 0;
    for (const p of payments) {
      if (!isCompleted(p.status)) continue;
      if (p.payment_date >= ms && p.payment_date < me) income += p.amount;
    }
    const expense = Math.round((expenseByMonthKey.get(ymKey) ?? 0) * 100) / 100;
    monthlyIncomeVsExpense.push({ label, income: Math.round(income * 100) / 100, expense });
  }

  const aiCashflowInsight = buildAiCashflowInsight({
    overdueAmount,
    overdueInvoiceCount,
    outstandingAmount,
    paidThisMonth,
    expensesThisMonth,
    collectionMomPercent,
  });

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

  const actionItems = buildActionItems({
    overdueAmount,
    overdueInvoiceCount,
    dueSoonAmount,
    dueSoonCount,
    viewedUnpaidAmount,
    viewedUnpaidCount,
  });

  const lifetimeCollected = paidVsUnpaid.find((s) => s.key === 'paid')?.value ?? 0;
  const lifetimeOutstanding = paidVsUnpaid.find((s) => s.key === 'unpaid')?.value ?? 0;
  const lifetimeBase = lifetimeCollected + lifetimeOutstanding;
  const collectionRatePercent =
    lifetimeBase > 0 ? Math.round((lifetimeCollected / lifetimeBase) * 1000) / 10 : null;

  const businessPulse = buildBusinessPulse({
    overdueAmount,
    overdueInvoiceCount,
    outstandingAmount,
    avgDaysToPay,
    collectionMomPercent,
    collectionRatePercent,
  });

  return {
    currency,
    overview: {
      invoicedThisMonth,
      outstandingAmount,
      outstandingInvoiceCount,
      overdueAmount,
      overdueInvoiceCount,
      paidThisMonth,
      paidInvoiceCountThisMonth,
      expensesThisMonth: Math.round(expensesThisMonth * 100) / 100,
    },
    revenueByDay,
    paidVsUnpaid,
    monthlyIncomeVsExpense,
    aiCashflowInsight,
    insights: {
      collectionMomPercent,
      topPayingClient,
    },
    actionItems,
    businessPulse,
    expectedIncoming: Math.round(expectedIncoming * 100) / 100,
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
    {
      id: '00000000-0000-0000-0000-000000000003',
      invoice_number: 'TI-00038',
      client_name: 'Sky & Co',
      status: 'overdue',
      issue_date: addUtcDays(now.toISOString().slice(0, 10), -40),
      due_date: addUtcDays(now.toISOString().slice(0, 10), -12),
      currency,
      total_amount: 6100,
      paid_amount: 0,
      balance_amount: 6100,
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      invoice_number: 'TI-00043',
      client_name: 'Evergreen Consulting',
      status: 'viewed',
      issue_date: addUtcDays(now.toISOString().slice(0, 10), -3),
      due_date: addUtcDays(now.toISOString().slice(0, 10), 5),
      currency,
      total_amount: 4200,
      paid_amount: 0,
      balance_amount: 4200,
    },
  ];

  const monthlyIncomeVsExpense = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
    return {
      label: d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      income: 12000 + i * 2400,
      expense: 4200 + i * 180,
    };
  });

  const overdueAmount = 6100;
  const overdueInvoiceCount = 1;
  const outstandingAmount = 20900;
  const collectionMomPercent = 12.4;

  return {
    currency,
    overview: {
      invoicedThisMonth: 45200,
      outstandingAmount,
      outstandingInvoiceCount: 4,
      overdueAmount,
      overdueInvoiceCount,
      paidThisMonth: 31800,
      paidInvoiceCountThisMonth: 9,
      expensesThisMonth: 11200,
    },
    revenueByDay,
    paidVsUnpaid: [
      { key: 'paid', name: 'Collected', value: 128400 },
      { key: 'unpaid', name: 'Outstanding', value: 20900 },
    ],
    monthlyIncomeVsExpense,
    aiCashflowInsight: buildAiCashflowInsight({
      overdueAmount,
      overdueInvoiceCount,
      outstandingAmount,
      paidThisMonth: 31800,
      expensesThisMonth: 11200,
      collectionMomPercent,
    }),
    insights: {
      collectionMomPercent,
      topPayingClient: { name: 'Pulse Media', totalPaid: 45800 },
    },
    actionItems: buildActionItems({
      overdueAmount,
      overdueInvoiceCount,
      dueSoonAmount: 8400,
      dueSoonCount: 1,
      viewedUnpaidAmount: 9200,
      viewedUnpaidCount: 2,
      paymentsTodayAmount: 7500,
      paymentsTodayCount: 2,
    }),
    businessPulse: buildBusinessPulse({
      overdueAmount,
      overdueInvoiceCount,
      outstandingAmount,
      avgDaysToPay: 11.5,
      collectionMomPercent,
      avgDaysDelta: -2.3,
      collectionRatePercent: 87.2,
      collectionRateDelta: 6.7,
    }),
    expectedIncoming: 12600,
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
