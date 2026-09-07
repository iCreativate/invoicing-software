import { StatusBadge } from '@/components/invoice/StatusBadge';
import type { InvoiceListItem } from '@/features/invoices/types';

export function InvoiceListStatusBadge({ inv }: { inv: InvoiceListItem }) {
  return <StatusBadge status={inv.status} />;
}
