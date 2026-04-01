import type { InvoiceStatus } from './types';

export function getInvoiceStatusLabel(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partial: 'Partially paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };
  return map[status] ?? 'Draft';
}

export function getInvoiceStatusClasses(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    paid: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900',
    partial:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900',
    sent: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900',
    overdue: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900',
    cancelled:
      'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800',
    draft:
      'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800',
  };
  return map[status] ?? map.draft;
}

