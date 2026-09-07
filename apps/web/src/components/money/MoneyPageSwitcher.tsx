'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { MONEY_SECTION_TABS, isTabActive } from '@/lib/navigation/section-tabs';
import { cn } from '@/lib/utils/cn';

const MONEY_OPEN_KEY = 'ti-money-nav-open';

export function getActiveMoneyTab(pathname: string) {
  return MONEY_SECTION_TABS.find((tab) => isTabActive(pathname, tab)) ?? MONEY_SECTION_TABS[0];
}

/**
 * Collapsible Money group in the sidebar.
 * Open by default; chevron toggles the page list.
 */
export function MoneySidebarMenu({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const moneySectionActive = MONEY_SECTION_TABS.some((tab) => isTabActive(pathname, tab));
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MONEY_OPEN_KEY);
      if (stored === '0') setOpen(false);
      if (stored === '1') setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MONEY_OPEN_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Collapsed rail: jump to overview; children aren't visible
  if (collapsed) {
    return (
      <Link
        href={MONEY_SECTION_TABS[0]?.href ?? '/money'}
        onClick={onNavigate}
        title="Money"
        className={cn(moneySectionActive ? 'nav-item-active' : 'nav-item', 'justify-center px-2')}
        aria-current={moneySectionActive ? 'page' : undefined}
      >
        <Wallet className={cn('h-4 w-4 shrink-0 opacity-80', moneySectionActive && 'opacity-100 text-[var(--tl-accent)]')} />
      </Link>
    );
  }

  return (
    <div className="ti-nav-collapse">
      <div className={cn('ti-nav-collapse-head', moneySectionActive && 'is-active')}>
        <Link
          href={MONEY_SECTION_TABS[0]?.href ?? '/money'}
          onClick={onNavigate}
          className="ti-nav-collapse-label"
        >
          <Wallet className={cn('h-4 w-4 shrink-0 opacity-80', moneySectionActive && 'opacity-100 text-[var(--tl-accent)]')} />
          <span className="truncate">Money</span>
        </Link>
        <button
          type="button"
          className="ti-nav-collapse-toggle"
          aria-expanded={open}
          aria-controls="ti-money-nav-drawer"
          aria-label={open ? 'Collapse Money pages' : 'Expand Money pages'}
          onClick={toggle}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </div>

      <div
        id="ti-money-nav-drawer"
        className={cn('ti-nav-collapse-drawer', open ? 'is-open' : 'is-closed')}
        hidden={!open}
      >
        <ul className="ti-nav-collapse-list" role="list">
          {MONEY_SECTION_TABS.map((tab) => {
            const selected = isTabActive(pathname, tab);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  onClick={onNavigate}
                  className={cn('ti-nav-subitem', selected && 'is-active')}
                  aria-current={selected ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
