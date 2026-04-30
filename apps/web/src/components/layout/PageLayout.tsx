import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Standard page structure inside {@link AppShell}:
 *
 * 1. **Header** — `title` + `actions` (AppShell props)
 * 2. **PageBody** — max-width container and vertical spacing
 * 3. **PageAlerts** — optional warnings / errors (first)
 * 4. **PageSummary** — optional KPI / summary cards
 * 5. **PageMain** — filters, table, form, or charts
 * 6. **PageActions** — bottom bar: export, bulk actions, save
 * 7. **PageFootnote** — optional hint text under main
 */

export function PageBody({
  children,
  className,
  maxWidthClassName = 'max-w-6xl',
}: {
  children: ReactNode;
  className?: string;
  /** e.g. max-w-5xl for narrower pages */
  maxWidthClassName?: string;
}) {
  return <div className={cn('mx-auto space-y-6', maxWidthClassName, className)}>{children}</div>;
}

export function PageAlerts({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}

export function PageSummary({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section aria-label="Summary" className={className}>
      {children}
    </section>
  );
}

export function PageMain({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section aria-label="Main content" className={cn('space-y-4', className)}>
      {children}
    </section>
  );
}

/** Primary actions after main content: export CSV, bulk actions, save. */
export function PageActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <footer
      className={cn(
        'flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end',
        className,
      )}
    >
      {children}
    </footer>
  );
}

export function PageFootnote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-center text-xs text-muted-foreground', className)}>{children}</p>;
}
