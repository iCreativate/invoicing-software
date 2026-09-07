import { cn } from '@/lib/utils/cn';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';

const LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const normalized = (status || 'draft').toLowerCase() as InvoiceStatus;
  return <span className={cn('ti-status', `ti-status-${normalized}`)}>{LABEL[normalized] ?? 'Draft'}</span>;
}
