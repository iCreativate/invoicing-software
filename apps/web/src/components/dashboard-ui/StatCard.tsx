import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function StatCard({
  label,
  value,
  sub,
  className,
  highlight,
  footer,
  hero,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
  highlight?: 'danger' | 'warning' | 'accent' | 'none';
  footer?: ReactNode;
  hero?: boolean;
}) {
  const danger = highlight === 'danger';

  return (
    <div className={cn('metric', className)}>
      <div className={cn('metric-label', danger && 'text-danger')}>{label}</div>
      <div className={cn(hero ? 'ti-metric-hero' : 'metric-value', danger && 'text-danger')}>{value}</div>
      {typeof sub === 'string' ? (
        <div className={cn('metric-meta', danger && 'text-danger/80')}>{sub}</div>
      ) : (
        sub
      )}
      {footer ? <div className="mt-1">{footer}</div> : null}
    </div>
  );
}
