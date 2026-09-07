'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isTabActive, type SectionTab } from '@/lib/navigation/section-tabs';
import { cn } from '@/lib/utils/cn';

function isPrefixActive(pathname: string, item: { href: string; matchPrefix?: string }) {
  const prefix = item.matchPrefix ?? item.href;
  return pathname === item.href || pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Hero pill tabs used across Money / People / Insights / Admin. */
export function SectionHeroNav({
  items,
  ariaLabel = 'Section',
  /** `section` uses shared active rules; `prefix` matches path prefixes only */
  match = 'prefix',
}: {
  items: SectionTab[] | { href: string; label: string; matchPrefix?: string }[];
  ariaLabel?: string;
  match?: 'prefix' | 'section';
}) {
  const pathname = usePathname() ?? '';
  return (
    <nav aria-label={ariaLabel} className="ti-hero-tabs">
      {items.map((item) => {
        const active =
          match === 'section' ? isTabActive(pathname, item as SectionTab) : isPrefixActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('ti-hero-tab', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
