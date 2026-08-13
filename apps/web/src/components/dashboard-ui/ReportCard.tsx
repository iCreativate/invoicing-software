import type { ReactNode } from 'react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils/cn';

export function ReportCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn('p-5', className)}>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </GlassCard>
  );
}
