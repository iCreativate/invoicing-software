'use client';

import type { ReactNode } from 'react';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils/cn';

export function AdminAlertBanner({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--tl-radius-sm)] px-4 py-3 text-[13px] leading-relaxed',
        tone === 'error' && 'bg-[color-mix(in_srgb,var(--tl-danger)_10%,white)] text-[var(--tl-danger)]',
        tone === 'success' && 'bg-[color-mix(in_srgb,var(--tl-success)_10%,white)] text-[var(--tl-success)]',
        tone === 'warning' &&
          'border border-[color-mix(in_srgb,var(--ti-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--ti-warning)_12%,white)] text-[var(--tl-ink)]',
        tone === 'info' &&
          'border border-[var(--tl-line)] bg-[var(--tl-bg)] text-[var(--tl-ink-2)]'
      )}
      role={tone === 'error' ? 'alert' : undefined}
    >
      {children}
    </div>
  );
}

export function AdminPanel({
  kicker,
  title,
  description,
  actions,
  className,
  bodyClassName,
  id,
  children,
}: {
  kicker?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <Surface variant="elevated" id={id} className={cn('p-5 sm:p-6', className)}>
      <SectionHeader kicker={kicker} title={title} description={description} actions={actions} />
      <div className={cn('mt-6', bodyClassName)}>{children}</div>
    </Surface>
  );
}

export function AdminInfoRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3.5">
      <div className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">{label}</div>
      <div className="mt-1.5 text-[15px] font-semibold text-[var(--tl-ink)]">{value}</div>
      {hint ? <p className="mt-2 ti-caption leading-relaxed text-[var(--tl-ink-3)]">{hint}</p> : null}
    </div>
  );
}

export function AdminStatusCard({
  title,
  description,
  badge,
  badgeTone = 'outline',
}: {
  title: string;
  description: string;
  badge: ReactNode;
  badgeTone?: 'outline' | 'default' | 'success';
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white p-4 shadow-[var(--shadow-elevated)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[var(--tl-ink)]">{title}</div>
        <p className="mt-1 ti-caption leading-relaxed text-[var(--tl-ink-3)]">{description}</p>
      </div>
      <div
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          badgeTone === 'success' && 'bg-[color-mix(in_srgb,var(--tl-success)_12%,white)] text-[var(--tl-success)]',
          badgeTone === 'default' && 'bg-[var(--tl-navy)] text-white',
          badgeTone === 'outline' && 'border border-[var(--tl-line)] bg-[var(--tl-bg)] text-[var(--tl-ink-2)]'
        )}
      >
        {badge}
      </div>
    </div>
  );
}
