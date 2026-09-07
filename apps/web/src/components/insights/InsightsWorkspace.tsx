'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero, type AppHeroImage } from '@/components/layout/AppPageHero';
import { PageBody } from '@/components/layout/PageLayout';
import { SectionHeroNav } from '@/components/layout/SectionHeroNav';
import { INSIGHTS_SECTION_TABS } from '@/lib/navigation/section-tabs';
import { cn } from '@/lib/utils/cn';

function insightsHeroImage(pathname: string): AppHeroImage {
  if (pathname.startsWith('/cashflow')) return 'money';
  if (pathname.startsWith('/reports')) return 'insights';
  return 'insights';
}

function insightsPageMeta(pathname: string): { title: string; description: string; kicker: string } {
  if (pathname.startsWith('/cashflow')) {
    return {
      kicker: 'Insights',
      title: 'Cashflow',
      description: 'Collected vs spend — where money moved.',
    };
  }
  if (pathname.startsWith('/reports/pl')) {
    return {
      kicker: 'Insights',
      title: 'Profit & Loss',
      description: 'Revenue, costs, and the bottom line.',
    };
  }
  if (pathname.startsWith('/reports')) {
    return {
      kicker: 'Insights',
      title: 'Reports',
      description: 'Exportable views of your business performance.',
    };
  }
  return {
    kicker: 'Insights',
    title: 'Insights',
    description: 'What happened, why it matters, and what to do next.',
  };
}

export function InsightsWorkspace({
  children,
  actions,
  title,
  description,
  kicker,
}: {
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
  description?: string;
  kicker?: string;
}) {
  const pathname = usePathname() ?? '';
  const meta = insightsPageMeta(pathname);
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
          nav={<SectionHeroNav items={INSIGHTS_SECTION_TABS} ariaLabel="Insights section" match="section" />}
          image={insightsHeroImage(pathname)}
          imageAlt="Timely insights workspace"
        />
        {children}
      </PageBody>
    </AppShell>
  );
}

export function InsightsFilterPills<T extends string>({
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
