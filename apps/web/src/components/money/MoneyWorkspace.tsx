'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero, type AppHeroImage } from '@/components/layout/AppPageHero';
import { PageBody } from '@/components/layout/PageLayout';
import { SectionHeroNav } from '@/components/layout/SectionHeroNav';
import { MONEY_SECTION_TABS } from '@/lib/navigation/section-tabs';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

function moneyHeroImage(pathname: string): AppHeroImage {
  if (pathname.startsWith('/expenses')) return 'expenses';
  if (pathname.startsWith('/quotes')) return 'quotes';
  if (pathname.startsWith('/reminders') || pathname.startsWith('/collections')) return 'collections';
  if (pathname.startsWith('/payments')) return 'payments';
  if (pathname.startsWith('/products-services')) return 'catalog';
  if (pathname.startsWith('/recurring')) return 'invoices';
  if (pathname.startsWith('/invoices')) return 'invoices';
  return 'money';
}

function moneyPageMeta(pathname: string): { title: string; description: string; kicker: string } {
  if (pathname.startsWith('/invoices')) {
    return {
      kicker: 'Money',
      title: 'Invoices',
      description: 'Create, send, and get paid — your full invoice ledger.',
    };
  }
  if (pathname.startsWith('/recurring')) {
    return {
      kicker: 'Money',
      title: 'Recurring',
      description: 'Automate retainers and repeat invoices on a schedule.',
    };
  }
  if (pathname.startsWith('/products-services')) {
    return {
      kicker: 'Money',
      title: 'Products',
      description: 'Services, products, and stock you reuse on invoices.',
    };
  }
  if (pathname.startsWith('/quotes')) {
    return {
      kicker: 'Money',
      title: 'Quotes',
      description: 'Price work, win deals, then convert to invoices.',
    };
  }
  if (pathname.startsWith('/payments')) {
    return {
      kicker: 'Money',
      title: 'Payments',
      description: 'Track money in — recorded and gateway payments.',
    };
  }
  if (pathname.startsWith('/reminders') || pathname.startsWith('/collections')) {
    return {
      kicker: 'Money',
      title: 'Collections',
      description: 'Chase overdue balances and get paid faster.',
    };
  }
  if (pathname.startsWith('/expenses')) {
    return {
      kicker: 'Money',
      title: 'Expenses',
      description: 'Capture spend, receipts, and categories.',
    };
  }
  return {
    kicker: 'Money',
    title: 'Money',
    description: 'Your financial ledger — invoices, payments, collections and expenses.',
  };
}

export function MoneyWorkspace({
  children,
  actions,
  subNav,
  title,
  description,
  kicker,
}: {
  children: ReactNode;
  actions?: ReactNode;
  /** Secondary hero tabs (e.g. All invoices / Recurring / Products) */
  subNav?: ReactNode;
  title?: string;
  description?: string;
  kicker?: string;
}) {
  const pathname = usePathname() ?? '';
  const meta = moneyPageMeta(pathname);
  const resolvedTitle = title ?? meta.title;
  const resolvedDescription = description ?? meta.description;
  const resolvedKicker = kicker ?? meta.kicker;

  return (
    <AppShell hideHeader title={resolvedTitle}>
      <PageBody>
        <AppPageHero
          kicker={resolvedKicker}
          title={resolvedTitle}
          description={resolvedDescription}
          actions={actions}
          nav={
            subNav ? (
              subNav
            ) : (
              <SectionHeroNav items={MONEY_SECTION_TABS} ariaLabel="Money section" match="section" />
            )
          }
          image={moneyHeroImage(pathname)}
          imageAlt="Timely product workspace"
        />
        {children}
      </PageBody>
    </AppShell>
  );
}

/** @deprecated Prefer SectionHeroNav — re-export for existing invoice call sites */
export { SectionHeroNav as MoneySubNav } from '@/components/layout/SectionHeroNav';

export const MONEY_INVOICE_SUBNAV = [
  { href: routes.app.invoices, label: 'All invoices', matchPrefix: '/invoices' },
  { href: routes.app.recurring, label: 'Recurring', matchPrefix: '/recurring' },
  { href: routes.app.productsServices, label: 'Products', matchPrefix: '/products-services' },
];

export function MoneyFilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="ti-pill-track">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn('ti-pill', active ? 'ti-pill-active' : 'ti-pill-idle')}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
