'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type TabItem = {
  value: string;
  label: string;
  badge?: ReactNode;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('ti-tabs', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            className="ti-tab"
            onClick={() => onChange(item.value)}
          >
            <span className="inline-flex items-center gap-1.5">
              {item.label}
              {item.badge ? <span className="ti-tab-badge">{item.badge}</span> : null}
            </span>
            {active ? <span className="ti-tab-indicator" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
