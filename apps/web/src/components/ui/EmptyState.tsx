import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function EmptyState({
  kicker,
  icon,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ti-empty', className)}>
      {kicker ? <p className="ti-meta">{kicker}</p> : null}
      {icon ? (
        <div className="mb-3 mt-4 text-[var(--tl-ink-3)]" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="ti-h2 mt-2">{title}</h2>
      {description ? <p className="ti-empty-body">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ti-error', className)} role="alert">
      <div className="font-medium">{title}</div>
      {description ? <p className="ti-error-body">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
