import { Badge } from '@/components/ui/badge';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const normalized = (status || 'draft').toLowerCase() as InvoiceStatus;
  const label: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    partial: 'Partially paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };

  const variant: 'success' | 'partial' | 'danger' | 'primary' | 'outline' | 'default' =
    normalized === 'paid'
      ? 'success'
      : normalized === 'partial'
        ? 'partial'
        : normalized === 'overdue'
          ? 'danger'
          : normalized === 'sent' || normalized === 'viewed'
            ? 'primary'
            : normalized === 'cancelled'
              ? 'outline'
              : 'default';

  return <Badge variant={variant}>{label[normalized] ?? 'Draft'}</Badge>;
}
