import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { InvoiceListItem } from '@/features/invoices/types';

/** Paid / Pending / Overdue (with subtle pulse) / Cancelled — for list views. */
export function InvoiceListStatusBadge({ inv }: { inv: InvoiceListItem }) {
  const today = new Date().toISOString().slice(0, 10);
  const st = inv.status;

  if (st === 'cancelled') {
    return <Badge variant="outline">Cancelled</Badge>;
  }
  if (st === 'paid' || (inv.balance_amount <= 0 && inv.total_amount > 0 && inv.paid_amount > 0)) {
    return <Badge variant="success">Paid</Badge>;
  }

  const overdue =
    st === 'overdue' ||
    (inv.balance_amount > 0 && inv.due_date && inv.due_date < today && st !== 'draft');

  if (overdue) {
    return (
      <Badge
        variant="danger"
        className={cn('motion-safe:animate-pulse motion-reduce:animate-none')}
      >
        Overdue
      </Badge>
    );
  }

  return (
    <Badge variant="primary" className="bg-primary/12 text-primary border-primary/20">
      Pending
    </Badge>
  );
}
