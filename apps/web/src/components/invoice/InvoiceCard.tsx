import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import { StatusBadge, type InvoiceStatus } from './StatusBadge';
import { AmountDisplay } from './AmountDisplay';
import { routes } from '@/lib/routing/routes';

export function InvoiceCard({
  id,
  invoiceNumber,
  clientName,
  issueDate,
  dueDate,
  currency,
  total,
  balance,
  status,
  className,
}: {
  id: string;
  invoiceNumber: string;
  clientName?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currency: string;
  total: number;
  balance: number;
  status: InvoiceStatus;
  className?: string;
}) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`${routes.app.invoices}/${id}`}
            className="block truncate text-sm font-semibold text-foreground hover:underline"
          >
            {invoiceNumber || id.slice(0, 8)}
          </Link>
          <div className="mt-1 truncate text-sm text-muted-foreground">{clientName || '—'}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <AmountDisplay label="Total" amount={total} currency={currency} />
        <AmountDisplay
          label="Balance"
          amount={balance}
          currency={currency}
          tone={balance <= 0 ? 'success' : 'default'}
          className="text-right"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div>Issue: {issueDate || '—'}</div>
        <div>Due: {dueDate || '—'}</div>
      </div>
    </Card>
  );
}

