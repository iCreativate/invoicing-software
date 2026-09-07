import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { PLANS } from '@/lib/billing/entitlements';
import { LandingPrimaryLink, LandingSecondaryLink } from '@/components/landing/ProductChrome';
import { cn } from '@/lib/utils/cn';

const ORDER = ['free', 'pro', 'business'] as const;

const LABELS: Record<(typeof ORDER)[number], string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};

const FEATURES: Record<(typeof ORDER)[number], string[]> = {
  free: ['Unlimited invoices', 'Client directory', 'Outstanding overview', '1 workspace user'],
  pro: [
    'Everything in Free',
    'Payment links',
    'Automated reminders',
    'Cashflow insights',
    'Up to 3 users',
  ],
  business: [
    'Everything in Pro',
    'Advanced reporting',
    'Priority collections',
    'More templates',
    'Up to 25 users',
  ],
};

const FOR: Record<(typeof ORDER)[number], string> = {
  free: "Send invoices and see what's outstanding.",
  pro: 'Collect faster with links, reminders and cashflow.',
  business: 'Teams, reporting and collections at scale.',
};

export function PricingSection() {
  return (
    <section id="pricing" className="tl-section border-y border-[var(--tl-line)] bg-[var(--tl-bg)]">
      <div className="tl-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="tl-label">Pricing</p>
          <h2 className="tl-h2 mx-auto mt-4">
            Simple pricing.
            <br />
            No surprises.
          </h2>
          <p className="tl-body mx-auto mt-5">Start free. Upgrade when the work grows.</p>
        </div>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-6 lg:items-center">
          {ORDER.map((id) => {
            const p = PLANS[id];
            const popular = id === 'pro';
            const price = p.priceZarMonthly;

            return (
              <article
                key={id}
                className={cn('tl-pricing-card', popular && 'tl-pricing-card-featured')}
              >
                {popular ? <span className="tl-pricing-badge">Most popular</span> : null}

                <p
                  className={cn(
                    'text-sm font-semibold tracking-tight',
                    popular ? 'text-[var(--tl-accent)]' : 'text-[var(--tl-ink)]'
                  )}
                >
                  {LABELS[id]}
                </p>

                <div className="mt-6">
                  <p className="tl-num text-[2.75rem] font-semibold leading-none tracking-tight text-[var(--tl-ink)]">
                    {price === 0 ? 'R0' : `R${price}`}
                  </p>
                  <p className="mt-2.5 text-[13px] text-[var(--tl-ink-3)]">
                    {price === 0 ? 'Forever free' : 'per month · excl. VAT'}
                  </p>
                </div>

                <p className="mt-5 text-[14px] leading-relaxed text-[var(--tl-ink-2)]">{FOR[id]}</p>

                <div
                  className={cn(
                    'my-7 h-px w-full',
                    popular ? 'bg-[var(--tl-accent)]/20' : 'bg-[var(--tl-line)]'
                  )}
                />

                <ul className="flex-1 space-y-3.5 text-[14px]">
                  {FEATURES[id].map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 shrink-0 font-semibold',
                          popular ? 'text-[var(--tl-accent)]' : 'text-[var(--tl-success)]'
                        )}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="text-[var(--tl-ink)]">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9">
                  {popular ? (
                    <LandingPrimaryLink href={routes.auth.register} className="h-12 w-full justify-center">
                      Start with Pro
                    </LandingPrimaryLink>
                  ) : (
                    <LandingSecondaryLink href={routes.auth.register} className="h-12 w-full justify-center bg-white">
                      {id === 'free' ? 'Start free' : `Choose ${LABELS[id]}`}
                    </LandingSecondaryLink>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-14 text-center">
          <Link
            href={routes.marketing.pricing}
            className="rounded-sm text-sm font-medium text-[var(--tl-ink-2)] underline-offset-4 transition-colors hover:text-[var(--tl-ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)]"
          >
            Compare all plan features →
          </Link>
        </p>
      </div>
    </section>
  );
}
