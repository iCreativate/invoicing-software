'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { timelyImages } from '@/components/landing/timelyAssets';

/** Product lifestyle heroes for app pages (desk / documents — not people). */
export type AppHeroImage =
  | 'invoices'
  | 'quotes'
  | 'payments'
  | 'expenses'
  | 'collections'
  | 'clients'
  | 'insights'
  | 'catalog'
  | 'settings'
  | 'money'
  /** @deprecated Prefer semantic product keys; kept as aliases */
  | 'hero'
  | 'payment'
  | 'team'
  | 'creative'
  | 'owner'
  | 'studio'
  | 'cta';

const HERO_SRC: Record<AppHeroImage, string> = {
  invoices: timelyImages.product.invoices,
  quotes: timelyImages.product.quotes,
  payments: timelyImages.product.payments,
  expenses: timelyImages.product.expenses,
  collections: timelyImages.product.collections,
  clients: timelyImages.product.clients,
  insights: timelyImages.product.insights,
  catalog: timelyImages.product.catalog,
  settings: timelyImages.product.settings,
  money: timelyImages.product.money,
  // Aliases → product imagery
  hero: timelyImages.product.money,
  payment: timelyImages.product.payments,
  team: timelyImages.product.clients,
  creative: timelyImages.product.quotes,
  owner: timelyImages.product.settings,
  studio: timelyImages.product.insights,
  cta: timelyImages.product.collections,
};

export function AppPageHero({
  kicker,
  title,
  description,
  actions,
  nav,
  image = 'money',
  imageAlt = '',
  className,
  compact = false,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Subsection tabs / links rendered inside the hero band */
  nav?: ReactNode;
  image?: AppHeroImage;
  imageAlt?: string;
  className?: string;
  /** Slightly shorter band for dense list pages */
  compact?: boolean;
}) {
  return (
    <section
      className={cn('ti-app-hero', compact && 'ti-app-hero-compact', className)}
      aria-label={title}
    >
      <Image
        src={HERO_SRC[image]}
        alt={imageAlt || ''}
        fill
        priority={false}
        sizes="(max-width: 1440px) 100vw, 1440px"
        className="ti-app-hero-media object-cover"
      />
      <div className="ti-app-hero-veil" aria-hidden />
      <div className="ti-app-hero-content">
        <div className="ti-app-hero-top">
          <div className="min-w-0 max-w-2xl">
            {kicker ? <p className="ti-meta text-white/65">{kicker}</p> : null}
            <h1 className={cn('ti-h2 text-white', kicker && 'mt-1')}>{title}</h1>
            {description ? (
              <p className="ti-small mt-2 max-w-xl text-white/75">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0">{actions}</div>
          ) : null}
        </div>
        {nav ? <div className="ti-app-hero-nav">{nav}</div> : null}
      </div>
    </section>
  );
}
