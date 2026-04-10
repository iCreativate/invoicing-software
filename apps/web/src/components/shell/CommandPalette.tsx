'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Modal, ModalContent } from '@/components/ui/modal';
import { routes } from '@/lib/routing/routes';
import {
  LayoutDashboard,
  FileText,
  Users,
  Plus,
  Settings,
  BarChart3,
  Clock,
  Package,
  UsersRound,
  FileInput,
  CreditCard,
  Receipt,
  Repeat,
  PieChart,
  WalletCards,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

const go = [
  { label: 'Dashboard', href: routes.app.dashboard, icon: LayoutDashboard },
  { label: 'Invoices', href: routes.app.invoices, icon: FileText },
  { label: 'Quotes', href: routes.app.quotes, icon: FileInput },
  { label: 'Clients', href: routes.app.clients, icon: Users },
  { label: 'Products & services', href: routes.app.productsServices, icon: Package },
  { label: 'Reports', href: routes.app.reports, icon: BarChart3 },
  { label: 'Time tracking', href: routes.app.timeTracking, icon: Clock },
  { label: 'Team', href: routes.app.employees, icon: UsersRound },
  { label: 'Settings', href: routes.app.settings, icon: Settings },
];

const create = [
  { label: 'New invoice', href: `${routes.app.invoices}/new`, icon: FileText },
  { label: 'New quote', href: `${routes.app.quotes}/new`, icon: FileInput },
  { label: 'New client', href: `${routes.app.clients}/new`, icon: Users },
];

const more = [
  { label: 'Payments', href: routes.app.payments, icon: CreditCard },
  { label: 'Expenses', href: routes.app.expenses, icon: Receipt },
  { label: 'Recurring', href: routes.app.recurring, icon: Repeat },
  { label: 'P&L report', href: routes.app.reportsPl, icon: PieChart },
  { label: 'Payroll', href: routes.app.payroll, icon: WalletCards },
  { label: 'Profile', href: routes.app.profile, icon: User },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { canEdit, status } = useWorkspaceCapabilities();
  const showCreate = status === 'ready' && canEdit;

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const openEv = () => setOpen(true);
    window.addEventListener('ti-cmdk-open', openEv);
    return () => window.removeEventListener('ti-cmdk-open', openEv);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground',
          'hover:bg-muted/60 hover:text-foreground transition-colors min-w-[200px] lg:min-w-[260px]'
        )}
      >
        <span className="text-xs">Search or jump to…</span>
        <kbd className="ml-auto rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent
          showClose={false}
          className={cn(
            'top-[18%] max-w-xl -translate-y-0 -translate-x-1/2 p-0 overflow-hidden',
            'rounded-xl border-border shadow-2xl'
          )}
          onPointerDownOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <Command className="rounded-xl bg-popover [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
            <div className="border-b border-border px-3 py-2">
              <Command.Input
                placeholder="Search pages and actions…"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results.</Command.Empty>
              {showCreate ? (
                <Command.Group heading="Create">
                  {create.map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`create ${item.label}`}
                      onSelect={() => run(item.href)}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              <Command.Group heading="Go to">
                {go.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.label}
                    onSelect={() => run(item.href)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="More">
                {more.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.label}
                    onSelect={() => run(item.href)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
              <span className="font-mono">Esc</span> close · <span className="font-mono">⌘K</span> toggle
            </div>
          </Command>
        </ModalContent>
      </Modal>
    </>
  );
}
