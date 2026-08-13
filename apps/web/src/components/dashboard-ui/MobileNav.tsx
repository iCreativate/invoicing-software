'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { APP_NAV_MOBILE_PINNED, APP_NAV_PRIMARY, APP_NAV_MORE, type AppNavItem } from '@/lib/navigation/app-nav';
import { Menu, X } from 'lucide-react';

function NavIconButton({ item, onNavigate }: { item: AppNavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors duration-150',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-[var(--tl-radius)] border transition-colors duration-150',
          active
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'border-[var(--tl-line)] bg-white text-muted-foreground'
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="max-w-[4.5rem] truncate">{item.label}</span>
    </Link>
  );
}

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const rest = APP_NAV_PRIMARY.filter((i) => !APP_NAV_MOBILE_PINNED.some((p) => p.href === i.href));

  return (
    <>
      <nav
        className="ti-no-print fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--tl-line)] bg-[var(--tl-bg)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-between gap-1 px-1">
          {APP_NAV_MOBILE_PINNED.map((item) => (
            <NavIconButton key={item.href} item={item} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <span className="grid h-10 w-10 place-items-center rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-white">
              <Menu className="h-[18px] w-[18px]" />
            </span>
            More
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-[var(--tl-bg-deep)]/40" aria-label="Close" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[min(85dvh,600px)] overflow-hidden rounded-t-[var(--tl-radius)] border border-[var(--tl-line)] bg-[var(--tl-bg)] shadow-[var(--ti-shadow-lift)]">
            <div className="flex items-center justify-between border-b border-[var(--tl-line)] px-4 py-3">
              <span className="text-[13px] font-semibold tracking-[0.16em] text-foreground">TIMELY</span>
              <Button type="button" variant="ghost" size="sm" className="h-9 px-2" onClick={() => setMoreOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto p-4">
              {rest.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-white px-3 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-primary/5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-[var(--tl-line)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Operations
            </div>
            <div className="grid max-h-[30vh] grid-cols-2 gap-2 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {APP_NAV_MORE.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-white px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
