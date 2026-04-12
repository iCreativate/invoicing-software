'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { routes } from '@/lib/routing/routes';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Menu,
  LogOut,
  User,
  WalletCards,
  Receipt,
  Repeat,
  PieChart,
  FileInput,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  BarChart3,
  Clock,
  Package,
  UsersRound,
  Sparkles,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import { ProfileBootstrap } from '@/components/profile/ProfileBootstrap';
import { ThemeToggle } from '@/components/shell/ThemeToggle';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';

const SIDEBAR_KEY = 'ti-sidebar-collapsed';

type NavItem = { href: string; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { href: routes.app.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { href: routes.app.invoices, label: 'Invoices', icon: FileText },
  { href: routes.app.quotes, label: 'Quotes', icon: FileInput },
  { href: routes.app.clients, label: 'Clients', icon: Users },
  { href: routes.app.productsServices, label: 'Products / services', icon: Package },
  { href: routes.app.reports, label: 'Reports', icon: BarChart3 },
  { href: routes.app.timeTracking, label: 'Time tracking', icon: Clock },
  { href: routes.app.employees, label: 'Team', icon: UsersRound },
  { href: routes.app.settings, label: 'Settings', icon: Settings },
];

const SECONDARY_NAV: NavItem[] = [
  { href: routes.app.payments, label: 'Payments', icon: CreditCard },
  { href: routes.app.expenses, label: 'Expenses', icon: Receipt },
  { href: routes.app.recurring, label: 'Recurring', icon: Repeat },
  { href: routes.app.reportsPl, label: 'P&L', icon: PieChart },
  { href: routes.app.payroll, label: 'Payroll', icon: WalletCards },
  { href: routes.app.profile, label: 'Profile', icon: User },
];

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20'
          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function SidebarNav({
  collapsed,
  variant,
  onCloseMobile,
  onToggleCollapsed,
  onLogout,
}: {
  collapsed: boolean;
  variant: 'desktop' | 'mobile';
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  onLogout: () => void;
}) {
  const showLabels = variant === 'mobile' ? true : !collapsed;
  const navCollapsed = variant === 'mobile' ? false : collapsed;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-4',
          variant === 'desktop' && collapsed && 'flex-col px-2'
        )}
      >
        <Link
          href={routes.app.dashboard}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-xl',
            variant === 'desktop' && collapsed && 'justify-center'
          )}
          onClick={onCloseMobile}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          {showLabels ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">TimelyInvoices</div>
              <div className="truncate text-[11px] text-muted-foreground">Cash flow clarity</div>
            </div>
          ) : null}
        </Link>
        {variant === 'desktop' ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground hover:bg-muted',
              collapsed && 'mt-1'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={navCollapsed} onNavigate={onCloseMobile} />
        ))}
        {showLabels ? (
          <div className="pt-4">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">More</div>
          </div>
        ) : (
          <div className="my-2 h-px bg-border" />
        )}
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={navCollapsed} onNavigate={onCloseMobile} />
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-10 w-full justify-start gap-3 px-3 text-muted-foreground',
            !showLabels && 'justify-center px-0'
          )}
          onClick={onLogout}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {showLabels ? 'Log out' : null}
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  children,
  actions,
  fullWidth = true,
  hideHeader = false,
}: {
  /** Page title in the shell header; optional when `hideHeader` builds its own title. */
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  fullWidth?: boolean;
  /** When true, skip the default page title row (e.g. dashboard builds its own header). */
  hideHeader?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const caps = useWorkspaceCapabilities();
  const showQuickCreate = caps.status === 'ready' && caps.canEdit;

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_KEY);
      if (v === '1') setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void getBrowserUserSafe().then((user) => setUserEmail(user?.email ?? null));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/demo/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.assign('/');
  };

  return (
    <div className="min-h-dvh min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground">
      <ProfileBootstrap />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.35))]" />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card/95 backdrop-blur-md md:block',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-[76px]' : 'w-[260px]'
        )}
      >
        <SidebarNav
          variant="desktop"
          collapsed={collapsed}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={toggleCollapsed}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,min(300px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right))))] max-w-[100vw] flex-col border-r border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-3">
              <span className="text-sm font-semibold">Menu</span>
              <Button type="button" variant="ghost" size="sm" className="h-9 px-2" onClick={() => setMobileOpen(false)}>
                Close
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarNav
                variant="mobile"
                collapsed={false}
                onCloseMobile={() => setMobileOpen(false)}
                onToggleCollapsed={toggleCollapsed}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn('flex min-h-dvh flex-col', collapsed ? 'md:pl-[76px]' : 'md:pl-[260px]')}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl ti-no-print">
          <div className="flex h-14 w-full min-w-0 items-center gap-2 px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 lg:px-6">
            <div className="flex shrink-0 items-center gap-1 md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                aria-label="Search"
                onClick={() => window.dispatchEvent(new Event('ti-cmdk-open'))}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex min-w-0 flex-1 items-center">
              <CommandPalette />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
              {showQuickCreate ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 gap-1.5 px-2 shadow-sm sm:px-3"
                      aria-label="Quick create"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden lg:inline">Create</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>Quick create</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`${routes.app.invoices}/new`}>New invoice</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${routes.app.quotes}/new`}>New quote</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${routes.app.clients}/new`}>New client</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative" aria-label="Notifications">
                    <Bell className="h-[18px] w-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div
                className="hidden sm:flex h-9 items-center rounded-lg border border-border bg-muted/40 px-2.5 text-xs font-semibold tabular-nums text-foreground"
                title="Base currency"
              >
                R&nbsp;·&nbsp;ZAR
              </div>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" className="h-9 gap-2 px-2 max-w-[160px]">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                      {(userEmail?.[0] ?? 'U').toUpperCase()}
                    </div>
                    <span className="hidden truncate text-left text-sm font-medium lg:inline">{userEmail ?? 'Account'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="truncate text-xs text-muted-foreground">{userEmail ?? 'Signed in'}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={routes.app.profile}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={routes.app.settings}>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {caps.status === 'ready' && !caps.canEdit ? (
          <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-950 dark:text-amber-100">
            Read-only access: you can view data but not create or change records. Owner or admin can adjust your role under
            Team.
          </div>
        ) : null}

        <main
          className={cn(
            'min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-5 lg:px-8',
            fullWidth ? 'mx-auto w-full max-w-[1600px]' : 'mx-auto w-full max-w-6xl'
          )}
        >
          {!hideHeader ? (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ti-no-print">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title ?? 'Workspace'}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Workspace overview and shortcuts.</p>
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
          ) : (
            actions ? <div className="mb-6 flex justify-end ti-no-print">{actions}</div> : null
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
