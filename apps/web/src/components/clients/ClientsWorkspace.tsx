'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero, type AppHeroImage } from '@/components/layout/AppPageHero';
import { PageBody } from '@/components/layout/PageLayout';
import { SectionHeroNav } from '@/components/layout/SectionHeroNav';
import { PEOPLE_SECTION_TABS } from '@/lib/navigation/section-tabs';

function peopleHeroImage(pathname: string): AppHeroImage {
  if (pathname.startsWith('/team') || pathname.startsWith('/employees')) return 'clients';
  return 'clients';
}

function peoplePageMeta(pathname: string): { title: string; description: string; kicker: string } {
  if (pathname.startsWith('/team') || pathname.startsWith('/employees')) {
    return {
      kicker: 'People',
      title: 'Team',
      description: 'Roles, permissions, and invitations for this workspace.',
    };
  }
  return {
    kicker: 'People',
    title: 'Clients',
    description: 'Relationships, outstanding balances, and payment behaviour.',
  };
}

export function ClientsWorkspace({
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
  const meta = peoplePageMeta(pathname);
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
          nav={<SectionHeroNav items={PEOPLE_SECTION_TABS} ariaLabel="People section" match="section" />}
          image={peopleHeroImage(pathname)}
          imageAlt="Timely people workspace"
        />
        {children}
      </PageBody>
    </AppShell>
  );
}
