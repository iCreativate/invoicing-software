import { Badge } from '@/components/ui/badge';

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const normalized = (status || 'draft').toLowerCase() as InvoiceStatus;
  const label: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partial: 'Partially paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };

  const variant =
    normalized === 'paid'
      ? 'success'
      : normalized === 'partial'
        ? 'primary'
        : normalized === 'overdue'
          ? 'danger'
          : normalized === 'sent'
            ? 'primary'
            : normalized === 'cancelled'
              ? 'outline'
              : 'default';

  return <Badge variant={variant as any}>{label[normalized] ?? 'Draft'}</Badge>;
}

