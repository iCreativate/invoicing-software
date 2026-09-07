import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {kicker ? <p className="ti-meta">{kicker}</p> : null}
        <h1 className={cn('ti-h2 text-[var(--tl-ink)]', kicker && 'mt-1')}>{title}</h1>
        {description ? <p className="ti-small mt-1 max-w-2xl text-[var(--tl-ink-2)]">{description}</p> : null}
      </div>
      {actions ? <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {kicker ? <p className="ti-meta">{kicker}</p> : null}
        {title ? <h2 className={cn('ti-h3', kicker && 'mt-2')}>{title}</h2> : null}
        {description ? <p className="ti-small mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
