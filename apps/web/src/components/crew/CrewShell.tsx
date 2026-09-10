'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Banknote,
  Users,
  CreditCard,
  ScrollText,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/crew', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/crew/eft', label: 'EFT queue', icon: Banknote },
  { href: '/crew/accounts', label: 'Accounts', icon: Users },
  { href: '/crew/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/crew/audit', label: 'Audit', icon: ScrollText },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export function CrewShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '/crew';

  return (
    <div className="min-h-screen bg-[var(--tl-bg)] text-[var(--tl-ink)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-white/8 bg-[#020406] text-slate-200 md:flex">
          <div className="border-b border-white/8 px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--tl-accent,#2563EB)]/15 text-[var(--tl-accent,#2563EB)]">
                <Shield className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Timely internal
                </div>
                <div className="truncate text-sm font-semibold text-white">Crew ops</div>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4" aria-label="Crew">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href, 'exact' in item ? item.exact : false);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-70')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/8 px-4 py-4">
            <p className="truncate text-[11px] text-slate-500">{email}</p>
            <Link
              href="/settings/billing"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white"
            >
              Open billing <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--tl-line)] bg-[color-mix(in_srgb,var(--tl-bg)_92%,white)] backdrop-blur-md md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tl-ink-3)]">
                  Crew ops
                </div>
                <div className="text-sm font-semibold text-[var(--tl-ink)]">Timely console</div>
              </div>
              <p className="max-w-[40%] truncate text-[11px] text-[var(--tl-ink-3)]">{email}</p>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Crew mobile">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href, 'exact' in item ? item.exact : false);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium',
                      active
                        ? 'bg-[var(--tl-navy)] text-white'
                        : 'bg-[var(--tl-surface,#fff)] text-[var(--tl-ink-2)] ring-1 ring-[var(--tl-line)]'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
