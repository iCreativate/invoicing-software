'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { routes } from '@/lib/routing/routes';
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Briefcase,
  WalletCards,
  FileSpreadsheet,
  Receipt,
  Repeat,
  PieChart,
  FileInput,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { ProfileBootstrap } from '@/components/profile/ProfileBootstrap';

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-foreground text-background shadow-[var(--shadow-md)]'
          : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/10'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

export function AppShell({
  title,
  children,
  actions,
  fullWidth = false,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  fullWidth?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Clear demo session (no-op if not in demo)
      await fetch('/api/demo/logout', { method: 'POST' });
    } catch {
      // ignore
    }

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore (covers demo/no env)
    }

    window.location.assign('/');
  };

  const nav = useMemo(
    () => (
      <nav className="mt-4 flex flex-col gap-2">
        <NavLink href={routes.app.dashboard}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink href={routes.app.invoices}>
          <FileText className="h-4 w-4" />
          Invoices
        </NavLink>
        <NavLink href={routes.app.quotes}>
          <FileInput className="h-4 w-4" />
          Quotes
        </NavLink>
        <NavLink href={routes.app.recurring}>
          <Repeat className="h-4 w-4" />
          Recurring
        </NavLink>
        <NavLink href={routes.app.clients}>
          <Users className="h-4 w-4" />
          Clients
        </NavLink>
        <NavLink href={routes.app.payments}>
          <CreditCard className="h-4 w-4" />
          Payments
        </NavLink>
        <NavLink href={routes.app.expenses}>
          <Receipt className="h-4 w-4" />
          Expenses
        </NavLink>
        <NavLink href={routes.app.reportsPl}>
          <PieChart className="h-4 w-4" />
          P&amp;L
        </NavLink>
        <NavLink href={routes.app.employees}>
          <Briefcase className="h-4 w-4" />
          Employees
        </NavLink>
        <NavLink href={routes.app.payroll}>
          <WalletCards className="h-4 w-4" />
          Payroll
        </NavLink>
        <NavLink href={routes.app.reports}>
          <FileSpreadsheet className="h-4 w-4" />
          Reports
        </NavLink>
        <NavLink href={routes.app.profile}>
          <User className="h-4 w-4" />
          Profile
        </NavLink>
        <NavLink href={routes.app.settings}>
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </nav>
    ),
    []
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ProfileBootstrap />
      {/* Background wash */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#f8fafc,rgba(248,250,252,0.7))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.55))]" />

      {/* Fixed sidebar (desktop) */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-[260px] ti-no-print">
        <div className="h-full p-6">
          <div className="h-full rounded-3xl bg-white/60 backdrop-blur-xl shadow-[var(--shadow-md)] ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="flex h-full flex-col">
            <div className="px-5 pt-5">
              <div className="text-sm font-semibold tracking-tight text-foreground">TimelyInvoices</div>
              <div className="mt-1 text-xs text-muted-foreground">Cash flow clarity</div>
            </div>
            <div className="mt-4 flex-1 px-3 overflow-y-auto">{nav}</div>
            <div className="px-5 pb-5 pt-4">
              <div className="h-px bg-black/5 dark:bg-white/10" />
              <div className="mt-4 flex flex-col gap-3">
                <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} TimelyInvoices</div>
                <Button type="button" variant="ghost" className="h-10 justify-start px-3" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-xl dark:bg-black/40 dark:border-white/10 ti-no-print">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-[var(--shadow-sm)] ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm font-semibold tracking-tight">TimelyInvoices</div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-[var(--shadow-sm)] ring-1 ring-black/5 transition hover:bg-white dark:bg-white/10 dark:ring-white/10 dark:hover:bg-white/15"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-50 ti-no-print">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] bg-white/80 backdrop-blur-xl shadow-[var(--shadow-lg)] dark:bg-black/50">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="text-sm font-semibold">TimelyInvoices</div>
                <div className="text-xs text-muted-foreground">Cash flow clarity</div>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-3" onClick={() => setMobileOpen(false)}>
              {nav}
            </div>
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <main
        className={cn(
          'mx-auto w-full px-4 py-8 md:py-10 md:pl-[292px] md:pr-6',
          fullWidth ? 'max-w-none' : 'max-w-6xl'
        )}
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ti-no-print">
          <div>
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground">{title}</h1>
            <div className="mt-1 text-sm text-muted-foreground">Overview of your business cash position.</div>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

