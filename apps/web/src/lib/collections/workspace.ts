import type { InvoiceListItem } from '@/features/invoices/types';

export type CollectionView = 'overdue' | 'due_soon' | 'outstanding';

export type CollectionStep = {
  id: string;
  offsetDays: number;
  channel: string;
  templateKey: string;
};

export type EnrichedCollectionInvoice = InvoiceListItem & {
  daysOverdue: number;
  daysUntilDue: number;
};

export type CollectionMetrics = {
  overdueTotal: number;
  overdueCount: number;
  dueSoonTotal: number;
  dueSoonCount: number;
  outstandingTotal: number;
  outstandingCount: number;
  avgDaysOverdue: number;
  currency: string;
};

export type AgingBucket = {
  key: string;
  label: string;
  count: number;
  amount: number;
};

export type ClientOverdueRow = {
  clientId: string;
  clientName: string;
  invoiceCount: number;
  amount: number;
  maxDaysOverdue: number;
};

export function daysOverdue(dueDate: string, todayISO: string) {
  const a = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  const b = new Date(`${todayISO}T00:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86400000));
}

export function daysUntilDue(dueDate: string, todayISO: string) {
  const a = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  const b = new Date(`${todayISO}T00:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.floor((a - b) / 86400000));
}

export function isOpenInvoice(inv: InvoiceListItem) {
  return inv.status !== 'cancelled' && inv.balance_amount > 0;
}

export function enrichCollectionInvoices(rows: InvoiceListItem[], todayISO: string): EnrichedCollectionInvoice[] {
  return rows.map((inv) => ({
    ...inv,
    daysOverdue: inv.due_date ? daysOverdue(inv.due_date, todayISO) : 0,
    daysUntilDue: inv.due_date ? daysUntilDue(inv.due_date, todayISO) : 0,
  }));
}

export function filterCollectionView(
  rows: EnrichedCollectionInvoice[],
  view: CollectionView,
  todayISO: string
): EnrichedCollectionInvoice[] {
  const dueSoonCutoff = addDaysISO(todayISO, 7);

  return rows
    .filter((inv) => {
      if (!isOpenInvoice(inv)) return false;
      if (view === 'overdue') {
        return Boolean(inv.due_date && inv.due_date < todayISO);
      }
      if (view === 'due_soon') {
        return Boolean(inv.due_date && inv.due_date >= todayISO && inv.due_date <= dueSoonCutoff);
      }
      return true;
    })
    .sort((a, b) => {
      if (view === 'due_soon') {
        return (a.due_date || '').localeCompare(b.due_date || '') || b.balance_amount - a.balance_amount;
      }
      return b.daysOverdue - a.daysOverdue || b.balance_amount - a.balance_amount;
    });
}

export function computeCollectionMetrics(rows: EnrichedCollectionInvoice[], todayISO: string): CollectionMetrics {
  const open = rows.filter(isOpenInvoice);
  const currency = open[0]?.currency ?? rows[0]?.currency ?? 'ZAR';
  const dueSoonCutoff = addDaysISO(todayISO, 7);

  const overdue = open.filter((inv) => inv.due_date && inv.due_date < todayISO);
  const dueSoon = open.filter(
    (inv) => inv.due_date && inv.due_date >= todayISO && inv.due_date <= dueSoonCutoff
  );

  const overdueTotal = overdue.reduce((s, inv) => s + inv.balance_amount, 0);
  const avgDaysOverdue =
    overdue.length > 0
      ? Math.round(overdue.reduce((s, inv) => s + inv.daysOverdue, 0) / overdue.length)
      : 0;

  return {
    overdueTotal,
    overdueCount: overdue.length,
    dueSoonTotal: dueSoon.reduce((s, inv) => s + inv.balance_amount, 0),
    dueSoonCount: dueSoon.length,
    outstandingTotal: open.reduce((s, inv) => s + inv.balance_amount, 0),
    outstandingCount: open.length,
    avgDaysOverdue,
    currency,
  };
}

export function computeAgingBuckets(overdue: EnrichedCollectionInvoice[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { key: '1-30', label: '1–30 days', count: 0, amount: 0 },
    { key: '31-60', label: '31–60 days', count: 0, amount: 0 },
    { key: '61+', label: '61+ days', count: 0, amount: 0 },
  ];

  for (const inv of overdue) {
    const d = inv.daysOverdue;
    if (d <= 30) {
      buckets[0].count += 1;
      buckets[0].amount += inv.balance_amount;
    } else if (d <= 60) {
      buckets[1].count += 1;
      buckets[1].amount += inv.balance_amount;
    } else {
      buckets[2].count += 1;
      buckets[2].amount += inv.balance_amount;
    }
  }

  return buckets;
}

export function topClientsByOverdue(overdue: EnrichedCollectionInvoice[]): ClientOverdueRow[] {
  const map = new Map<string, ClientOverdueRow>();

  for (const inv of overdue) {
    const clientId = inv.client_id ?? inv.client_name ?? inv.id;
    const existing = map.get(clientId);
    if (existing) {
      existing.invoiceCount += 1;
      existing.amount += inv.balance_amount;
      existing.maxDaysOverdue = Math.max(existing.maxDaysOverdue, inv.daysOverdue);
    } else {
      map.set(clientId, {
        clientId,
        clientName: inv.client_name ?? 'Unknown client',
        invoiceCount: 1,
        amount: inv.balance_amount,
        maxDaysOverdue: inv.daysOverdue,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
}

export function offsetLabel(offsetDays: number) {
  if (offsetDays < 0) return `T${offsetDays}`;
  if (offsetDays === 0) return 'Due day';
  return `T+${offsetDays}`;
}

export function templateLabel(templateKey: string) {
  const labels: Record<string, string> = {
    before_due: 'Friendly heads-up',
    due: 'Due today',
    overdue_3: '3 days overdue',
    overdue_7: '7 days overdue',
    friendly_nudge: 'Friendly nudge',
    reminder: 'Payment reminder',
    firm_followup: 'Firm follow-up',
  };
  return labels[templateKey] ?? templateKey.replace(/_/g, ' ');
}

export function channelLabel(channel: string) {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'sms') return 'SMS';
  return 'Email';
}

function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
