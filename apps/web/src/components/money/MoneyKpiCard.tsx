'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const kpiFocus =
  'outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]';

export function MoneyKpiGrid({
  children,
  className,
  cols = 4,
  'aria-label': ariaLabel = 'Key metrics',
}: {
  children: ReactNode;
  className?: string;
  cols?: 3 | 4 | 5;
  'aria-label'?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'xl:grid-cols-4',
        cols === 5 && 'sm:grid-cols-3 xl:grid-cols-5',
        className
      )}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function MoneyKpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  trendDown,
  href,
  active,
  onClick,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  trendUp?: boolean;
  trendDown?: boolean;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      {Icon ? (
        <span className="ti-kpi-icon" aria-hidden>
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <span className="ti-kpi-value">{value}</span>
      <span className="ti-kpi-label">{label}</span>
      {trend != null && trend !== '' ? (
        <span className={cn('ti-kpi-trend', trendUp && 'ti-kpi-trend-up', trendDown && 'ti-kpi-trend-down')}>
          {trend}
        </span>
      ) : null}
    </>
  );

  const cardClass = cn(
    'ti-kpi-card',
    (href || onClick) && kpiFocus,
    active && 'ring-2 ring-[color-mix(in_srgb,var(--tl-accent)_40%,transparent)]',
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cardClass, 'w-full')}
        data-active={active ? 'true' : undefined}
      >
        {inner}
      </button>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
