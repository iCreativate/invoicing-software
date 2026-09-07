import type { ClientListItem } from '@/features/clients/types';

export type ClientDirectoryStatus = 'overdue' | 'outstanding' | 'active' | 'new';

export type ClientInvoiceRollup = {
  clientId: string;
  status: string;
  balance: number;
  paid: number;
  paidDate: string | null;
  dueDate: string | null;
  currency: string;
};

export type ClientDirectoryRow = ClientListItem & {
  invoiceCount: number;
  outstanding: number;
  lastPayment: string | null;
  status: ClientDirectoryStatus;
  overdueCount: number;
  currency: string;
};

export function isInvoiceOverdue(row: Pick<ClientInvoiceRollup, 'status' | 'balance' | 'dueDate'>, todayISO: string) {
  const st = row.status.toLowerCase();
  if (st === 'cancelled' || st === 'draft') return false;
  if (st === 'overdue') return row.balance > 0;
  return row.balance > 0 && Boolean(row.dueDate) && row.dueDate! < todayISO;
}

export function clientDirectoryStatus(args: {
  invoiceCount: number;
  outstanding: number;
  overdueCount: number;
}): ClientDirectoryStatus {
  if (args.overdueCount > 0) return 'overdue';
  if (args.outstanding > 0) return 'outstanding';
  if (args.invoiceCount > 0) return 'active';
  return 'new';
}

export function buildClientDirectory(
  clients: ClientListItem[],
  invoices: ClientInvoiceRollup[],
  todayISO = new Date().toISOString().slice(0, 10)
): ClientDirectoryRow[] {
  const byClient = new Map<string, ClientInvoiceRollup[]>();
  for (const inv of invoices) {
    const list = byClient.get(inv.clientId) ?? [];
    list.push(inv);
    byClient.set(inv.clientId, list);
  }

  return clients.map((client) => {
    const rows = byClient.get(client.id) ?? [];
    const live = rows.filter((r) => r.status.toLowerCase() !== 'cancelled');
    let outstanding = 0;
    let overdueCount = 0;
    let lastPayment: string | null = null;
    let currency = 'ZAR';
    for (const row of live) {
      outstanding += row.balance;
      if (isInvoiceOverdue(row, todayISO)) overdueCount += 1;
      if (row.paidDate && row.paid > 0 && (!lastPayment || row.paidDate > lastPayment)) {
        lastPayment = row.paidDate;
      }
      if (row.currency) currency = row.currency;
    }
    return {
      ...client,
      invoiceCount: live.length,
      outstanding,
      lastPayment,
      overdueCount,
      currency,
      status: clientDirectoryStatus({ invoiceCount: live.length, outstanding, overdueCount }),
    };
  });
}

export function directoryStatusLabel(status: ClientDirectoryStatus) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'outstanding') return 'Outstanding';
  if (status === 'active') return 'Active';
  return 'New';
}
