import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from './GlassCard';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn('p-10 text-center', className)}>
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--ti-radius)] bg-[var(--ti-brand-accent,#2F6F7E)]/10 text-[var(--ti-brand-accent,#2F6F7E)]">
          {icon}
        </div>
      ) : null}
      <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </GlassCard>
  );
}
