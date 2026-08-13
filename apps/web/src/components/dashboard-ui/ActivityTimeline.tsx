import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export type ActivityTimelineItem = {
  id: string;
  icon: ReactNode;
  title: string;
  meta?: string;
  time?: string;
  href?: string;
};

export function ActivityTimeline({ items, empty }: { items: ActivityTimelineItem[]; empty: ReactNode }) {
  if (!items.length) {
    return (
      <div className="rounded-[var(--ti-radius)] border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <ul className="max-h-[360px] space-y-0.5 overflow-y-auto pr-1">
      {items.map((item) => {
        const inner = (
          <>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ti-radius-sm)] bg-[var(--ti-brand-accent,#2F6F7E)]/10 text-[var(--ti-brand-accent,#2F6F7E)]">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                {item.time ? <span className="text-[11px] tabular-nums text-muted-foreground">{item.time}</span> : null}
              </span>
              {item.meta ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.meta}</span> : null}
            </span>
          </>
        );
        const cls = cn(
          'flex gap-3 rounded-[var(--ti-radius-sm)] border border-transparent px-2 py-2 transition-colors duration-150',
          'hover:border-border hover:bg-muted/50'
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
