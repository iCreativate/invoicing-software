'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero, type AppHeroImage } from '@/components/layout/AppPageHero';
import { PageBody } from '@/components/layout/PageLayout';
import { SectionHeroNav } from '@/components/layout/SectionHeroNav';
import { SETTINGS_SECTION_TABS } from '@/lib/navigation/section-tabs';

function settingsHeroImage(_pathname: string): AppHeroImage {
  return 'settings';
}

function settingsPageMeta(pathname: string): { title: string; description: string; kicker: string } {
  if (pathname.startsWith('/settings/profile')) {
    return { kicker: 'Admin', title: 'Profile', description: 'Your account details and identity.' };
  }
  if (pathname.startsWith('/settings/team')) {
    return { kicker: 'Admin', title: 'Team access', description: 'Who can work in this workspace.' };
  }
  if (pathname.startsWith('/settings/integrations')) {
    return { kicker: 'Admin', title: 'Integrations', description: 'Connect payments and messaging.' };
  }
  if (pathname.startsWith('/settings/billing')) {
    return { kicker: 'Admin', title: 'Billing', description: 'Plan, invoices, and subscription.' };
  }
  if (pathname.startsWith('/settings/notifications')) {
    return { kicker: 'Admin', title: 'Notifications', description: 'Email and reminder preferences.' };
  }
  if (pathname.startsWith('/settings/security')) {
    return { kicker: 'Admin', title: 'Security', description: 'Password and account protection.' };
  }
  if (pathname.startsWith('/settings/preferences')) {
    return { kicker: 'Admin', title: 'Preferences', description: 'Defaults for currency, dates, and UI.' };
  }
  if (pathname.startsWith('/payroll')) {
    return { kicker: 'Admin', title: 'Payroll', description: 'Staff pay runs for this workspace.' };
  }
  if (pathname.startsWith('/time-tracking')) {
    return { kicker: 'Admin', title: 'Time tracking', description: 'Hours you can bill or report on.' };
  }
  return {
    kicker: 'Admin',
    title: 'Workspace',
    description: 'Company details and how Timely works for you.',
  };
}

export function SettingsWorkspace({
  children,
  actions,
  subNav,
  title,
  description,
  kicker,
}: {
  children: ReactNode;
  actions?: ReactNode;
  /** Secondary hero tabs when a page needs nested navigation */
  subNav?: ReactNode;
  title?: string;
  description?: string;
  kicker?: string;
}) {
  const pathname = usePathname() ?? '';
  const meta = settingsPageMeta(pathname);
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
              <SectionHeroNav items={SETTINGS_SECTION_TABS} ariaLabel="Admin section" match="section" />
            )
          }
          image={settingsHeroImage(pathname)}
          imageAlt="Timely admin workspace"
        />
        {children}
      </PageBody>
    </AppShell>
  );
}

/** @deprecated Prefer SectionHeroNav — alias for admin call sites */
export { SectionHeroNav as AdminSubNav } from '@/components/layout/SectionHeroNav';
