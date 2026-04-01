'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { routes } from '@/lib/routing/routes';

/** g-d-style shortcuts: g then i (invoices), g q (quotes), etc. */
export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let seq = '';
    let reset: ReturnType<typeof setTimeout> | null = null;

    const bump = () => {
      if (reset) clearTimeout(reset);
      reset = setTimeout(() => {
        seq = '';
      }, 900);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === '?' && seq === 'g') {
        e.preventDefault();
        seq = '';
        const msg = [
          'Keyboard shortcuts',
          'g i — Invoices',
          'g q — Quotes',
          'g c — Clients',
          'g x — Expenses',
          'g p — Payments',
          'g r — Recurring',
          'g l — P&L',
          'g d — Dashboard',
        ].join('\n');
        window.alert(msg);
        return;
      }

      if (seq === 'g') {
        e.preventDefault();
        const map: Record<string, string> = {
          i: routes.app.invoices,
          q: routes.app.quotes,
          c: routes.app.clients,
          x: routes.app.expenses,
          p: routes.app.payments,
          r: routes.app.recurring,
          l: routes.app.reportsPl,
          d: routes.app.dashboard,
        };
        const dest = map[k];
        seq = '';
        if (dest && !pathname.startsWith('/login') && !pathname.startsWith('/register')) router.push(dest);
        return;
      }

      if (k === 'g') {
        seq = 'g';
        bump();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (reset) clearTimeout(reset);
    };
  }, [pathname, router]);

  return null;
}
