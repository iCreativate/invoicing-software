import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { PLANS, type PlanId } from '@/lib/billing/entitlements';
import { Reveal } from '@/components/landing/landingMotion';
import { cn } from '@/lib/utils/cn';

const ORDER: PlanId[] = ['free', 'pro', 'business'];

const FOR: Record<PlanId, string> = {
  free: 'Getting started — send invoices and track status.',
  starter: 'Getting started — send invoices and track status.',
  pro: 'Growing SMEs — payment links, reminders and cashflow.',
  business: 'Teams — permissions, reporting and collections sequences.',
};

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
      <Reveal>
        <p className="tl-label">Pricing</p>
        <h2 className="tl-h2 mt-3">Simple ZAR plans.</h2>
        <p className="tl-body mt-4 max-w-lg">Start free. Upgrade when payment links, automation and team workflows matter.</p>
      </Reveal>

      <div className="mt-14 border-t border-[var(--tl-line)]">
        {ORDER.map((id, i) => {
          const p = PLANS[id];
          const primary = id === 'pro';
          return (
            <Reveal key={id} delayMs={i * 40}>
              <div
                className={cn(
                  'grid gap-4 border-b border-[var(--tl-line)] py-8 sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-8',
                  primary && 'bg-[var(--tl-accent-soft)] px-4 sm:-mx-4 sm:rounded-[var(--tl-radius)] sm:border-transparent sm:px-6'
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--tl-ink)]">{p.label}</p>
                  {primary ? <p className="mt-1 text-[11px] font-medium text-[var(--tl-accent)]">Most chosen</p> : null}
                </div>
                <div>
                  <p className="tl-num text-2xl font-semibold tracking-tight sm:text-3xl">
                    {p.priceZarMonthly === 0 ? 'R 0' : `R ${p.priceZarMonthly}`}
                    {p.priceZarMonthly > 0 ? (
                      <span className="ml-1 text-sm font-normal text-[var(--tl-ink-3)]">/ mo</span>
                    ) : null}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-[var(--tl-ink-2)]">{FOR[id]}</p>
                </div>
                <div>
                  <Link
                    href={routes.auth.register}
                    className={cn(
                      'inline-flex h-10 items-center rounded-[var(--tl-radius)] px-4 text-sm font-medium transition-opacity',
                      primary
                        ? 'bg-[var(--tl-accent)] text-white hover:opacity-90'
                        : 'border border-[var(--tl-line-strong)] text-[var(--tl-ink)] hover:bg-[var(--tl-surface)]'
                    )}
                  >
                    {id === 'free' ? 'Start free' : `Choose ${p.label}`}
                  </Link>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-[var(--tl-ink-3)]">
        <Link href={routes.marketing.pricing} className="underline-offset-4 hover:underline">
          Full plan comparison
        </Link>
      </p>
    </section>
  );
}
