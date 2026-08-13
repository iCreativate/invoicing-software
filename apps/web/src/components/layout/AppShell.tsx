'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { routes } from '@/lib/routing/routes';
import { Menu, LogOut, Plus, Bell, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { ProfileBootstrap } from '@/components/profile/ProfileBootstrap';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { MobileNav } from '@/components/dashboard-ui/MobileNav';
import { APP_NAV_GROUPS, APP_NAV_MORE, type AppNavItem } from '@/lib/navigation/app-nav';
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

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: AppNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  const ai = item.href === routes.app.insights;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        active ? 'nav-item-active' : 'nav-item',
        collapsed && 'justify-center px-2'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={cn('h-4 w-4 shrink-0 opacity-75', active && 'opacity-100')} />
      {!collapsed ? (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate">{item.label}</span>
          {ai ? (
            <span className="rounded-badge bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#f6f4f0]">
              AI
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarNav({
  collapsed,
  variant,
  onCloseMobile,
  onToggleCollapsed,
  userEmailLabel,
}: {
  collapsed: boolean;
  variant: 'desktop' | 'mobile';
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  userEmailLabel: string | null;
}) {
  const showLabels = variant === 'mobile' ? true : !collapsed;
  const navCollapsed = variant === 'mobile' ? false : collapsed;
  const isDemo = Boolean(userEmailLabel?.includes('demo@'));
  const workspaceName = isDemo ? 'Demo Business' : 'Timely';
  const planLabel = isDemo ? 'Demo' : 'Free';
  const userName = userEmailLabel?.split('@')[0] || 'Account';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex h-12 shrink-0 items-center gap-1.5 border-b border-sidebar-border px-4',
          variant === 'desktop' && collapsed && 'justify-center px-2'
        )}
      >
        <Link
          href={routes.app.dashboard}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2',
            variant === 'desktop' && collapsed && 'flex-none justify-center'
          )}
          onClick={onCloseMobile}
        >
          {showLabels ? (
            <div className="min-w-0">
              <div className="text-[13px] font-semibold tracking-[0.16em] text-sidebar-text-active">TIMELY</div>
              {workspaceName !== 'Timely' ? (
                <div className="truncate text-[11px] text-sidebar-text">{workspaceName}</div>
              ) : null}
            </div>
          ) : (
            <span className="text-[11px] font-semibold tracking-[0.14em] text-sidebar-text-active">TI</span>
          )}
        </Link>
        {showLabels ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
                aria-label="Switch workspace"
              >
                <ChevronsUpDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={routes.app.settings} onClick={onCloseMobile}>
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={routes.app.billing} onClick={onCloseMobile}>
                  Billing · {planLabel}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {variant === 'desktop' ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {APP_NAV_GROUPS.map((group, index) => (
          <div key={group.id}>
            {showLabels ? (
              <div className={cn('nav-section', index === 0 && 'pt-1')}>{group.label}</div>
            ) : group.id !== 'overview' ? (
              <div className="mx-2 my-2 h-px bg-sidebar-border" />
            ) : null}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={navCollapsed} onNavigate={onCloseMobile} />
            ))}
          </div>
        ))}
        {showLabels ? <div className="nav-section">More</div> : <div className="mx-2 my-2 h-px bg-sidebar-border" />}
        {APP_NAV_MORE.map((item) => (
          <NavLink key={item.href} item={item} collapsed={navCollapsed} onNavigate={onCloseMobile} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href={routes.app.profile}
          onClick={onCloseMobile}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-1 py-0.5 hover:bg-sidebar-hover',
            !showLabels && 'justify-center px-0'
          )}
          title={showLabels ? undefined : userName}
        >
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-[#f6f4f0]">
            {(userEmailLabel ?? 'U').charAt(0).toUpperCase()}
          </div>
          {showLabels ? (
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-sidebar-text-active">{userName}</div>
              <div className="truncate text-[11px] text-sidebar-text">{planLabel}</div>
            </div>
          ) : null}
        </Link>
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
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  fullWidth?: boolean;
  hideHeader?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const caps = useWorkspaceCapabilities();
  // Defer permission-gated chrome until after mount so SSR HTML matches the first client paint.
  // Capabilities still resolve in the provider; this only delays showing Quick create / read-only banner.
  const [chromeReady, setChromeReady] = useState(false);
  useEffect(() => {
    setChromeReady(true);
  }, []);
  const showQuickCreate = chromeReady && caps.status === 'ready' && caps.canEdit;

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_KEY);
      if (v === '1') setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isDemoUiActive()) {
        if (!cancelled) setUserEmail('demo@timelyinvoices.app');
        return;
      }
      const user = await getBrowserUserSafe();
      if (!cancelled) setUserEmail(user?.email ?? null);
    })();
    return () => {
      cancelled = true;
    };
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
    if (!isDemoUiActive()) {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    window.location.assign('/');
  };

  return (
    <div className="app-shell ti-fintech-app">
      <ProfileBootstrap />

      <aside
        className={cn(
          'sidebar',
          'transition-[width] duration-200 ease-out',
          collapsed ? '!w-[68px]' : 'w-[232px]'
        )}
      >
        <SidebarNav
          variant="desktop"
          collapsed={collapsed}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={toggleCollapsed}
          userEmailLabel={userEmail}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="sidebar absolute inset-y-0 left-0 flex w-[min(100%,min(288px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right))))] max-w-[100vw] flex-col pb-[env(safe-area-inset-bottom)] shadow-elevated">
            <SidebarNav
              variant="mobile"
              collapsed={false}
              onCloseMobile={() => setMobileOpen(false)}
              onToggleCollapsed={toggleCollapsed}
              userEmailLabel={userEmail}
            />
          </div>
        </div>
      ) : null}

      <div className="main-area">
        <header className="topbar ti-no-print pt-[env(safe-area-inset-top)]">
            <div className="flex shrink-0 items-center gap-1 md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Search"
                onClick={() => window.dispatchEvent(new Event('ti-cmdk-open'))}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex min-w-0 flex-1 items-center">
              <CommandPalette />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1.5">
              {hideHeader && actions ? (
                <div className="hidden items-center gap-1.5 sm:flex">{actions}</div>
              ) : null}
              {showQuickCreate ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="primary" size="sm" className="gap-1.5" aria-label="Quick create">
                      <Plus className="h-3.5 w-3.5" />
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
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Notifications">
                    <Bell className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={routes.app.notifications}>Open notification centre</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="max-w-[160px] gap-2 px-1.5">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {(userEmail?.[0] ?? 'U').toUpperCase()}
                    </div>
                    <span className="hidden truncate text-left text-[13px] font-medium lg:inline">{userEmail ?? 'Account'}</span>
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
        </header>

        {chromeReady && caps.status === 'ready' && !caps.canEdit ? (
          <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs font-medium text-foreground">
            Read-only access. Owner or admin can adjust your role under{' '}
            <Link href={routes.app.team} className="font-semibold underline underline-offset-2">
              Team
            </Link>
            .
          </div>
        ) : null}

        <main className="page-content pb-[max(5.5rem,env(safe-area-inset-bottom))] md:pb-0">
          <div className={cn('page-container', !fullWidth && 'max-w-6xl')}>
            {!hideHeader ? (
              <div className="page-header mb-5 flex-col sm:flex-row sm:items-end ti-no-print">
                <div>
                  <h1 className="page-title">{title ?? 'Workspace'}</h1>
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
