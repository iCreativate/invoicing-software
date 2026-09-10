'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

export function CrewPageHeader({
  kicker = 'Timely crew',
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="ti-caption uppercase tracking-[0.12em] text-[var(--tl-ink-3)]">{kicker}</p>
        <h1 className="ti-h2 mt-1 text-[var(--tl-ink)]">{title}</h1>
        {description ? (
          <p className="ti-body mt-1.5 max-w-2xl text-[var(--tl-ink-2)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CrewPanel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Surface variant="elevated" className={cn('p-5 sm:p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-[15px] font-semibold text-[var(--tl-ink)]">{title}</h2> : null}
            {description ? (
              <p className="ti-caption mt-1 text-[var(--tl-ink-3)]">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Surface>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3.5',
        tone === 'warning' && 'border-[color-mix(in_srgb,var(--ti-warning,#D97706)_35%,var(--tl-line))]',
        tone === 'danger' && 'border-[color-mix(in_srgb,var(--tl-danger)_30%,var(--tl-line))]',
        tone === 'success' && 'border-[color-mix(in_srgb,var(--tl-success)_30%,var(--tl-line))]'
      )}
    >
      <div className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--tl-ink)]">{value}</div>
      {hint ? <p className="ti-caption mt-1 text-[var(--tl-ink-3)]">{hint}</p> : null}
    </div>
  );
}

export function statusBadgeVariant(
  status: string
): 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'outline' {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'approved') return 'success';
  if (s === 'pending' || s === 'past_due' || s === 'cancel_at_period_end') return 'warning';
  if (s === 'suspended' || s === 'rejected' || s === 'terminated' || s === 'cancelled') return 'danger';
  if (s === 'inactive') return 'outline';
  return 'default';
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{status}</Badge>;
}

export function PlanBadge({ plan }: { plan: string }) {
  return <Badge variant="outline">{plan}</Badge>;
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="ti-body py-6 text-center text-[var(--tl-ink-3)]">{children}</p>;
}
