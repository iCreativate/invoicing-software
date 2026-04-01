import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/format/money';

export function AmountDisplay({
  label,
  amount,
  currency,
  tone = 'default',
  className,
}: {
  label: string;
  amount: number;
  currency: string;
  tone?: 'default' | 'success' | 'danger';
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div
        className={cn(
          'text-lg font-semibold tracking-tight',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-danger'
        )}
      >
        {formatMoney(amount, currency)}
      </div>
    </div>
  );
}

