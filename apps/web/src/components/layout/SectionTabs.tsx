'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { isTabActive, type SectionTab } from '@/lib/navigation/section-tabs';

export function SectionTabs({ tabs, className }: { tabs: SectionTab[]; className?: string }) {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Section" className={cn('ti-tabs', className)}>
      {tabs.map((tab) => {
        const active = isTabActive(pathname, tab);
        const ai = tab.href.endsWith('/ai');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="ti-tab"
            aria-current={active ? 'page' : undefined}
            data-active={active}
          >
            <span className="inline-flex items-center gap-1.5">
              {tab.label}
              {ai ? <span className="ti-tab-badge">AI</span> : null}
            </span>
            {active ? <span className="ti-tab-indicator" aria-hidden /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
