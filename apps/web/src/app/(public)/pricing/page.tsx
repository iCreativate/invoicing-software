import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import { PLANS, type PlanId } from '@/lib/billing/entitlements';

export const metadata: Metadata = {
  title: 'Pricing — TimelyInvoices',
  description: 'Simple ZAR pricing for South African businesses. Starter free, Pro R299, Business R799.',
};

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

const ORDER: PlanId[] = ['free', 'pro', 'business'];

const FEATURE_COPY: Record<PlanId, string[]> = {
  free: ['Professional invoices', 'Client list', 'Payment status tracking', 'CSV import'],
  starter: ['Professional invoices', 'Client list', 'Payment status tracking', 'CSV import'],
  pro: ['Payment links', 'Automated reminders', 'Analytics & cashflow insights', 'Recurring invoices'],
  business: ['Team permissions', 'Advanced reporting', 'Priority support', 'Collections sequences'],
};

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge className="w-fit">
            Pricing
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple ZAR pricing</h1>
          <p className="max-w-2xl text-muted-foreground">
            Start free. Upgrade when you need payment links, reminders, and team workflows. Prices in South African Rand.
          </p>
        </header>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {ORDER.map((id) => {
            const p = PLANS[id];
            const highlighted = id === 'pro';
            return (
              <div
                key={id}
                className={cn(
                  'rounded-[var(--ti-radius)] border border-border bg-card p-6 shadow-[var(--shadow-sm)]',
                  highlighted && 'ring-1 ring-primary/30'
                )}
              >
                <div className="text-sm font-semibold text-muted-foreground">{p.label}</div>
                <div className="mt-2 ti-metric-display text-3xl">
                  {p.priceZarMonthly === 0 ? 'R 0' : `R ${p.priceZarMonthly}`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.priceZarMonthly === 0 ? 'For getting set up' : 'per month'}
                </div>
                <ul className="mt-6 space-y-2">
                  {FEATURE_COPY[id].map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {id === 'business' ? (
                    <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full" variant="secondary">
                        Talk to us
                      </Button>
                    </a>
                  ) : (
                    <Link href={routes.auth.register}>
                      <Button className="w-full" variant={highlighted ? 'primary' : 'secondary'}>
                        {id === 'free' ? 'Start free' : 'Choose Pro'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href={routes.marketing.home} className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
