import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import { PLANS, type PlanId, FREE_MONTHLY_INVOICE_SEND_LIMIT } from '@/lib/billing/entitlements';

export const metadata: Metadata = {
  title: 'Pricing — TimelyInvoices',
  description: 'Simple ZAR pricing for South African businesses. Starter free, Pro R59, Business R799.',
};

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

const ORDER: PlanId[] = ['free', 'pro', 'business'];

const freeLimit = (key: 'team_members' | 'invoice_templates') =>
  Number(PLANS.free.entitlements[key] ?? 0);
const proLimit = (key: 'team_members' | 'invoice_templates') =>
  Number(PLANS.pro.entitlements[key] ?? 0);
const businessLimit = (key: 'team_members' | 'invoice_templates') =>
  Number(PLANS.business.entitlements[key] ?? 0);

const FEATURE_COPY: Record<PlanId, string[]> = {
  free: [
    `${FREE_MONTHLY_INVOICE_SEND_LIMIT} invoices / month · ${freeLimit('team_members')} user · ${freeLimit('invoice_templates')} templates`,
    'Clients + outstanding overview',
    '“Powered by Timely” on docs',
    'No recurring, reminders, payment links, collections, or advanced reports',
  ],
  starter: [
    `${FREE_MONTHLY_INVOICE_SEND_LIMIT} invoices / month · ${freeLimit('team_members')} user · ${freeLimit('invoice_templates')} templates`,
    'Clients + outstanding overview',
    '“Powered by Timely” on docs',
    'No recurring, reminders, payment links, collections, or advanced reports',
  ],
  pro: [
    'Everything in Starter, plus:',
    'Unlimited invoices · recurring · reminders · payment links · collections',
    'Cashflow + advanced reports',
    `${proLimit('team_members')} users · ${proLimit('invoice_templates')} templates · branding removed`,
  ],
  business: [
    'Everything in Pro, plus:',
    `${businessLimit('team_members')} users · ${businessLimit('invoice_templates')} templates · team-scale collections & reporting`,
  ],
};

type CompareRow = {
  label: string;
  starter: string;
  pro: string;
  business: string;
};

const COMPARE_ROWS: CompareRow[] = [
  {
    label: 'Price',
    starter: 'Free',
    pro: `R${PLANS.pro.priceZarMonthly}/mo`,
    business: `R${PLANS.business.priceZarMonthly}/mo`,
  },
  {
    label: 'Invoices',
    starter: `${FREE_MONTHLY_INVOICE_SEND_LIMIT}/mo`,
    pro: 'Unlimited',
    business: 'Unlimited',
  },
  {
    label: 'Users',
    starter: String(freeLimit('team_members')),
    pro: String(proLimit('team_members')),
    business: String(businessLimit('team_members')),
  },
  {
    label: 'Templates',
    starter: String(freeLimit('invoice_templates')),
    pro: String(proLimit('invoice_templates')),
    business: String(businessLimit('invoice_templates')),
  },
  {
    label: 'Recurring / reminders / payment links / collections',
    starter: '—',
    pro: '✓',
    business: '✓',
  },
  {
    label: 'Cashflow + advanced reports',
    starter: '—',
    pro: '✓',
    business: '✓',
  },
  {
    label: 'Remove “Powered by Timely”',
    starter: '—',
    pro: '✓',
    business: '✓',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge className="w-fit">Pricing</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple ZAR pricing</h1>
          <p className="max-w-2xl text-muted-foreground">
            Start free. Upgrade when you need payment links, reminders, and team workflows. Prices in
            South African Rand.
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
                  {p.priceZarMonthly === 0 ? 'Free' : `R${p.priceZarMonthly}`}
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

        <section className="mt-14 overflow-hidden rounded-[var(--ti-radius)] border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight">Compare plans</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Limits match product entitlements — Starter free, Pro R{PLANS.pro.priceZarMonthly},
              Business R{PLANS.business.priceZarMonthly}.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6" scope="col">
                    {' '}
                  </th>
                  <th className="px-4 py-3 font-semibold sm:px-6" scope="col">
                    Starter
                  </th>
                  <th className="px-4 py-3 font-semibold sm:px-6" scope="col">
                    Pro
                  </th>
                  <th className="px-4 py-3 font-semibold sm:px-6" scope="col">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <th
                      className="px-4 py-3 font-medium text-muted-foreground sm:px-6"
                      scope="row"
                    >
                      {row.label}
                    </th>
                    <td className="px-4 py-3 sm:px-6">{row.starter}</td>
                    <td className="px-4 py-3 sm:px-6">{row.pro}</td>
                    <td className="px-4 py-3 sm:px-6">{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href={routes.marketing.home} className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
