import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function ProductChrome({
  title,
  trailing,
  children,
  className,
  dark,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--tl-radius)] border',
        dark
          ? 'border-white/10 bg-[#0f1520] text-slate-100'
          : 'border-[var(--tl-line)] bg-[var(--tl-surface)] text-[var(--tl-ink)] shadow-[var(--tl-shadow)]',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b px-4 py-2.5',
          dark ? 'border-white/10' : 'border-[var(--tl-line)]'
        )}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
        <span
          className={cn(
            'ml-3 min-w-0 truncate text-[11px] font-medium tracking-wide',
            dark ? 'text-slate-400' : 'text-[var(--tl-ink-3)]'
          )}
        >
          {title}
        </span>
        {trailing ? <div className="ml-auto min-w-0 truncate">{trailing}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function ProductSidebar({
  active,
  dark,
}: {
  active: 'Dashboard' | 'Money' | 'Clients' | 'Insights';
  dark?: boolean;
}) {
  const items = ['Dashboard', 'Money', 'Clients', 'Insights'] as const;
  return (
    <aside
      className={cn(
        'hidden border-r px-3 py-4 lg:block',
        dark ? 'border-white/10 bg-[#0a0e16]' : 'border-[var(--tl-line)] bg-[var(--tl-navy)]'
      )}
    >
      <p className="px-2 text-[10px] font-semibold tracking-[0.16em] text-white/90">TIMELY</p>
      <nav className="mt-5 space-y-0.5 text-[12px]" aria-hidden>
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              'rounded-lg px-2 py-1.5',
              item === active ? 'bg-white/12 text-white' : 'text-white/45'
            )}
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function landingLinkClass(variant: 'primary' | 'secondary', className?: string) {
  return cn(variant === 'primary' ? 'tl-btn-primary' : 'tl-btn-secondary', className);
}

export function LandingPrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      {children}
      <span className="tl-btn-arrow" aria-hidden>
        →
      </span>
    </>
  );
  if (href.startsWith('#')) {
    return (
      <a href={href} className={landingLinkClass('primary', className)}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={landingLinkClass('primary', className)}>
      {content}
    </Link>
  );
}

export function LandingSecondaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (href.startsWith('#')) {
    return (
      <a href={href} className={landingLinkClass('secondary', className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={landingLinkClass('secondary', className)}>
      {children}
    </Link>
  );
}
