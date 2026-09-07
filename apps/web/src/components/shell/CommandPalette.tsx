'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal';
import { routes } from '@/lib/routing/routes';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { cn } from '@/lib/utils/cn';
import { openAskTimely } from '@/components/ai/AskTimelyDrawer';
import { resolveLocalCommand } from '@/lib/ai/commandLayer';
import { storeAskInvoicePrefill } from '@/lib/invoices/askPrefill';

const go = [
  { label: 'Dashboard', href: routes.app.dashboard },
  { label: 'Money', href: routes.app.money },
  { label: 'Clients', href: routes.app.clients },
  { label: 'Team', href: routes.app.team },
  { label: 'Insights', href: routes.app.insights },
  { label: 'Settings', href: routes.app.settings },
];

const create = [
  { label: 'New invoice', href: `${routes.app.invoices}/new` },
  { label: 'New quote', href: `${routes.app.quotes}/new` },
  { label: 'New client', href: `${routes.app.clients}/new` },
];

const more = [
  { label: 'Invoices', href: routes.app.invoices },
  { label: 'Quotes', href: routes.app.quotes },
  { label: 'Payments', href: routes.app.payments },
  { label: 'Collections', href: routes.app.collections },
  { label: 'Expenses', href: routes.app.expenses },
  { label: 'Cashflow', href: routes.app.cashflow },
  { label: 'Reports', href: routes.app.reports },
  { label: 'Profit & Loss', href: routes.app.reportsPl },
  { label: 'Recurring invoices', href: routes.app.recurring },
  { label: 'Products & services', href: routes.app.productsServices },
  { label: 'Integrations', href: routes.app.settingsIntegrations },
  { label: 'Billing', href: routes.app.settingsBilling },
  { label: 'Payroll', href: routes.app.payroll },
  { label: 'Notifications', href: routes.app.notifications },
  { label: 'Notification preferences', href: routes.app.settingsNotifications },
  { label: 'Time tracking', href: routes.app.timeTracking },
  { label: 'Profile', href: routes.app.settingsProfile },
  { label: 'Security', href: routes.app.settingsSecurity },
  { label: 'Preferences', href: routes.app.settingsPreferences },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { canEdit, status } = useWorkspaceCapabilities();
  const showCreate = status === 'ready' && canEdit;

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router]
  );

  const timelyMatch = useMemo(() => resolveLocalCommand(query), [query]);

  const askTimely = useCallback(
    (text: string, fromMatch = false) => {
      setOpen(false);
      setQuery('');
      if (fromMatch && timelyMatch?.invoicePrefill) {
        storeAskInvoicePrefill(timelyMatch.invoicePrefill);
      }
      if (fromMatch && timelyMatch?.autoNavigate && timelyMatch.actions[0]?.href) {
        router.push(timelyMatch.actions[0].href);
        return;
      }
      openAskTimely(text);
    },
    [router, timelyMatch]
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

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex h-10 max-w-full min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 text-left text-[13px] text-[var(--tl-ink-3)]',
          'hover:border-[var(--tl-line-strong)] hover:bg-white hover:text-[var(--tl-ink-2)] transition-colors md:min-w-[240px] lg:max-w-xl lg:min-w-[320px]'
        )}
      >
        <svg
          className="h-4 w-4 shrink-0 text-[var(--tl-ink-3)]"
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
        <span className="truncate">Search invoices, clients, or ask Timely…</span>
        <kbd className="ml-auto rounded-full border border-[var(--tl-line)] bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--tl-ink-3)]">
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
          <ModalTitle className="sr-only">Ask Timely</ModalTitle>
          <Command className="rounded-xl bg-popover [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
            <div className="border-b border-border px-3 py-2">
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Tell Timely what you need, or jump to a page…"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <Command.Empty className="py-4 text-center text-sm text-muted-foreground">
                {query.trim() ? (
                  <button type="button" className="text-foreground hover:underline" onClick={() => askTimely(query.trim())}>
                    Ask Timely: {query.trim()}
                  </button>
                ) : (
                  'No results.'
                )}
              </Command.Empty>
              {query.trim() ? (
                <Command.Group heading="Ask Timely">
                  <Command.Item
                    value={`ask timely ${query}`}
                    onSelect={() => askTimely(query.trim(), true)}
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                  >
                    {timelyMatch?.reply || `Ask Timely: ${query.trim()}`}
                  </Command.Item>
                </Command.Group>
              ) : null}
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
