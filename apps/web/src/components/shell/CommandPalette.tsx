'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal';
import { routes } from '@/lib/routing/routes';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { cn } from '@/lib/utils/cn';

const go = [
  { label: 'Dashboard', href: routes.app.dashboard },
  { label: 'Invoices', href: routes.app.invoices },
  { label: 'Quotes', href: routes.app.quotes },
  { label: 'Clients', href: routes.app.clients },
  { label: 'Collections', href: routes.app.collections },
  { label: 'Cashflow', href: routes.app.cashflow },
  { label: 'Insights', href: routes.app.insights },
  { label: 'Reports', href: routes.app.reports },
  { label: 'Notifications', href: routes.app.notifications },
  { label: 'Settings', href: routes.app.settings },
];

const create = [
  { label: 'New invoice', href: `${routes.app.invoices}/new` },
  { label: 'New quote', href: `${routes.app.quotes}/new` },
  { label: 'New client', href: `${routes.app.clients}/new` },
];

const more = [
  { label: 'Payments', href: routes.app.payments },
  { label: 'Expenses', href: routes.app.expenses },
  { label: 'Billing', href: routes.app.billing },
  { label: 'Integrations', href: routes.app.integrations },
  { label: 'Recurring', href: routes.app.recurring },
  { label: 'Products & services', href: routes.app.productsServices },
  { label: 'Team', href: routes.app.team },
  { label: 'Payroll', href: routes.app.payroll },
  { label: 'Time tracking', href: routes.app.timeTracking },
  { label: 'Profile', href: routes.app.profile },
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
          'hidden md:flex h-8 max-w-full min-w-0 flex-1 items-center gap-2 rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-white px-2.5 text-left text-[13px] text-slate-500',
          'hover:bg-muted hover:text-slate-700 transition-colors md:min-w-[200px] lg:min-w-[280px]'
        )}
      >
        <svg
          className="h-3.5 w-3.5 shrink-0 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span className="truncate">Search or jump to…</span>
        <kbd className="ml-auto rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400">
          ⌘K
        </kbd>
      </button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent
          showClose={false}
          className={cn(
            'top-[max(12dvh,env(safe-area-inset-top))] max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] w-[calc(100%-2rem)] max-w-xl -translate-y-0 -translate-x-1/2 overflow-hidden p-0 sm:top-[18%]',
            'rounded-xl border-border shadow-2xl'
          )}
          onPointerDownOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <ModalTitle className="sr-only">Command palette</ModalTitle>
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
                      className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                    >
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
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                  >
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
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                  >
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
