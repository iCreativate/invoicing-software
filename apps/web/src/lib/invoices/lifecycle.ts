/**
 * Invoice status transition helpers + lifecycle timestamps.
 */

import type { InvoiceStatus } from '@/features/invoices/types';

const ALLOWED: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['viewed', 'partial', 'paid', 'overdue', 'cancelled'],
  viewed: ['partial', 'paid', 'overdue', 'cancelled'],
  partial: ['paid', 'overdue', 'cancelled'],
  paid: ['cancelled'],
  overdue: ['partial', 'paid', 'cancelled', 'viewed'],
  cancelled: [],
};

export function canTransitionInvoiceStatus(from: InvoiceStatus, to: InvoiceStatus): boolean {
  if (from === to) return true;
  return (ALLOWED[from] ?? []).includes(to);
}

export type InvoiceLifecycleTimestamps = {
  created_at?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  viewed_at?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
};

export function lifecycleFieldsForStatus(status: InvoiceStatus, now = new Date()): Partial<Record<string, string>> {
  const iso = now.toISOString();
  if (status === 'sent') return { sent_at: iso };
  if (status === 'viewed') return { viewed_at: iso };
  if (status === 'paid') return { paid_date: iso.slice(0, 10) };
  return {};
}
