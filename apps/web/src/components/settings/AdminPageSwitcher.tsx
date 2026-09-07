'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { SETTINGS_SECTION_TABS, isTabActive } from '@/lib/navigation/section-tabs';
import { isSettingsNavActive } from '@/lib/navigation/nav-active';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

const ADMIN_OPEN_KEY = 'ti-admin-nav-open';

export function getActiveAdminTab(pathname: string) {
  return SETTINGS_SECTION_TABS.find((tab) => isTabActive(pathname, tab)) ?? SETTINGS_SECTION_TABS[0];
}

/**
 * Collapsible Admin group in the sidebar — mirrors Money navigation.
 */
export function AdminSidebarMenu({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const adminSectionActive = isSettingsNavActive(pathname);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_OPEN_KEY);
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
        localStorage.setItem(ADMIN_OPEN_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <Link
        href={routes.app.settings}
        onClick={onNavigate}
        title="Admin"
        className={cn(adminSectionActive ? 'nav-item-active' : 'nav-item', 'justify-center px-2')}
        aria-current={adminSectionActive ? 'page' : undefined}
      >
        <Settings className={cn('h-4 w-4 shrink-0 opacity-80', adminSectionActive && 'opacity-100 text-[var(--tl-accent)]')} />
      </Link>
    );
  }

  return (
    <div className="ti-nav-collapse">
      <div className={cn('ti-nav-collapse-head', adminSectionActive && 'is-active')}>
        <Link href={routes.app.settings} onClick={onNavigate} className="ti-nav-collapse-label">
          <Settings className={cn('h-4 w-4 shrink-0 opacity-80', adminSectionActive && 'opacity-100 text-[var(--tl-accent)]')} />
          <span className="truncate">Admin</span>
        </Link>
        <button
          type="button"
          className="ti-nav-collapse-toggle"
          aria-expanded={open}
          aria-controls="ti-admin-nav-drawer"
          aria-label={open ? 'Collapse Admin pages' : 'Expand Admin pages'}
          onClick={toggle}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </div>

      <div
        id="ti-admin-nav-drawer"
        className={cn('ti-nav-collapse-drawer', open ? 'is-open' : 'is-closed')}
        hidden={!open}
      >
        <ul className="ti-nav-collapse-list" role="list">
          {SETTINGS_SECTION_TABS.map((tab) => {
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
