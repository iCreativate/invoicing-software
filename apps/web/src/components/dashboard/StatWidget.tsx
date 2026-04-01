import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

export function StatWidget({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'danger';
  className?: string;
}) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-muted-foreground">{label}</div>
          <div
            className={cn(
              'mt-1 text-2xl font-semibold tracking-tight',
              tone === 'primary' && 'text-primary',
              tone === 'success' && 'text-success',
              tone === 'danger' && 'text-danger'
            )}
          >
            {value}
          </div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        {icon ? (
          <div className="rounded-xl border border-border bg-muted/30 p-2 text-muted-foreground">{icon}</div>
        ) : null}
      </div>
    </Card>
  );
}

