'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import { Container, Eyebrow, H2, PLead, Reveal, Section } from '@/components/landing/landingPrimitives';
import { DashboardMock } from '@/components/landing/DashboardMock';
import {
  FAQAccordion,
  FeaturePanel,
  MetricPill,
  PremiumButton,
  PricingCard,
  SectionLabel,
  TestimonialQuote,
} from '@/components/landing/premium';

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const toggleFaq = useCallback((i: number) => {
    setFaqOpen((prev) => (prev === i ? null : i));
  }, []);

  const pricing = useMemo(
    () => [
      {
        name: 'Starter',
        price: 'R 0',
        hint: 'For getting set up',
        cta: 'Start free',
        highlighted: false,
        features: ['Professional invoices', 'Client list', 'Payment status tracking', 'CSV import'],
      },
      {
        name: 'Pro',
        price: 'R 299',
        hint: 'Built for SA businesses',
        cta: 'Choose Pro',
        highlighted: true,
        features: ['Payment links', 'Automated reminders', 'Analytics & cashflow insights', 'Recurring invoices'],
      },
      {
        name: 'Business',
        price: 'R 799',
        hint: 'For teams & scale',
        cta: 'Talk to us',
        highlighted: false,
        features: ['Team permissions', 'Advanced reporting', 'Priority support', 'Custom workflows'],
      },
    ],
    []
  );

  return (
    <div className="ti-landing min-h-dvh overflow-x-hidden antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 55% at 20% 0%, rgba(11,31,51,0.08), transparent 60%), radial-gradient(55% 45% at 90% 15%, rgba(15,118,110,0.08), transparent 62%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <motion.a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_18px_44px_-10px_rgba(37,211,102,0.48)]"
        style={{ backgroundColor: '#25D366' }}
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp us
      </motion.a>

      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ borderColor: 'var(--ti-border)', background: 'color-mix(in oklab, var(--ti-bg) 86%, transparent)' }}
      >
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-[14px] border bg-white transition-transform duration-300 group-hover:-translate-y-0.5"
              style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)', boxShadow: 'var(--ti-shadow)' }}
            >
              <div className="h-3.5 w-3.5 rounded-md" style={{ background: 'var(--ti-accent)' }} />
            </div>
            <div className="leading-tight">
              <div className="text-[0.95rem] font-semibold tracking-tight">TimelyInvoices</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--ti-text-2)' }}>
                South Africa
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => scrollToId('pricing')}
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-[hsl(var(--ti-landing-muted))] transition-colors hover:bg-black/5 md:inline-flex"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToId('faq')}
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-[hsl(var(--ti-landing-muted))] transition-colors hover:bg-black/5 lg:inline-flex"
            >
              FAQ
            </button>
            <Link href={routes.auth.login}>
              <PremiumButton variant="secondary" className="text-sm">
                Sign in
              </PremiumButton>
            </Link>
            <Link href={routes.auth.register} className="hidden sm:inline-flex">
              <PremiumButton size="md" className={cn('px-5')}>
                Start free
              </PremiumButton>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        {/* Hero */}
        <Section className="pt-16 sm:pt-20 lg:pt-24">
          <Container>
            <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="pt-2">
                <Reveal>
                  <SectionLabel>Built for SA businesses</SectionLabel>
                </Reveal>

                <Reveal className="mt-6">
                  <h1 className="text-balance text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.04em] sm:text-5xl lg:text-[3.6rem]">
                    Invoicing and cashflow, built to feel effortless.
                  </h1>
                  <p className="mt-5 max-w-xl text-pretty text-lg leading-[1.8] sm:text-xl" style={{ color: 'var(--ti-text-2)' }}>
                    TimelyInvoices helps South African teams send polished invoices, track payment status, and get paid
                    from secure links—without losing time to admin.
                  </p>
                </Reveal>

                <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href={routes.auth.register} className="w-full sm:w-auto">
                    <PremiumButton size="lg" className="h-12 w-full px-7 sm:w-auto">
                      Start free
                    </PremiumButton>
                  </Link>
                  <PremiumButton
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => scrollToId('product-showcase')}
                    className="h-12 w-full px-7 sm:w-auto"
                  >
                    View the product
                  </PremiumButton>
                </Reveal>

                <Reveal className="mt-10 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'ZAR pricing', body: 'Clear monthly plans for SA businesses.' },
                    { label: 'Payment links', body: 'Clients pay without friction.' },
                    { label: 'Overdue control', body: 'Reminders that protect relationships.' },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="rounded-2xl border px-5 py-4 transition-[transform,box-shadow] hover:-translate-y-[2px]"
                      style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)', boxShadow: 'var(--ti-shadow)' }}
                    >
                      <div className="text-sm font-semibold">{t.label}</div>
                      <div className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--ti-text-2)' }}>
                        {t.body}
                      </div>
                    </div>
                  ))}
                </Reveal>

                <div className="mt-8 text-xs" style={{ color: 'var(--ti-text-2)' }}>
                  No credit card to start. Upgrade when your volume grows.
                </div>
              </div>

              <div id="product-showcase" className="lg:pt-2">
                <DashboardMock />
              </div>
            </div>

            <div className="mt-14 border-t pt-10" style={{ borderColor: 'var(--ti-border)' }}>
              <Eyebrow>Trusted by growing businesses</Eyebrow>
              <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm font-semibold" style={{ color: 'var(--ti-text-2)' }}>
                {['Cape Creative', 'Ubuntu Labs', 'Savannah Tech', 'Atlas Studio', 'Karoo Digital'].map((n) => (
                  <span key={n} className="opacity-80 transition-opacity hover:opacity-100">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* Features (mixed layout) */}
        <Section>
          <Container>
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <Eyebrow>Product</Eyebrow>
                <H2 className="mt-3">Less admin. More momentum.</H2>
                <PLead>Richer, product-led workflows for invoicing, payment status, reminders, and reporting.</PLead>
              </div>
              <div className="hidden lg:block text-sm text-[hsl(var(--ti-landing-muted))]">
                Built for clarity • VAT-aware totals • Cashflow-first
              </div>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <FeaturePanel
                  eyebrow="Smart invoicing"
                  title="Invoices that look premium—and get paid."
                  body="Create invoices that match your brand, include VAT correctly, and keep clients on a simple payment path."
                  rightSlot={
                    <div className="hidden sm:block">
                      <MetricPill tone="success">Status: Sent → Paid</MetricPill>
                    </div>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { k: 'Invoice numbers', v: 'Consistent numbering and templates' },
                      { k: 'Client-ready PDFs', v: 'Print / save to PDF instantly' },
                      { k: 'Payment links', v: 'Secure checkout link per invoice' },
                      { k: 'Timeline', v: 'Viewed / reminded / paid events' },
                    ].map((r) => (
                      <div key={r.k} className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)' }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--ti-text)' }}>
                          {r.k}
                        </div>
                        <div className="mt-1 text-sm" style={{ color: 'var(--ti-text-2)' }}>
                          {r.v}
                        </div>
                      </div>
                    ))}
                  </div>
                </FeaturePanel>
              </div>

              <div className="lg:col-span-5 grid gap-6">
                <FeaturePanel
                  eyebrow="Payment tracking"
                  title="Know what’s paid. Chase what isn’t."
                  body="Track sent, paid, partial and overdue invoices at a glance—no spreadsheet reconciliation."
                />
                <FeaturePanel
                  tone="muted"
                  eyebrow="Automated reminders"
                  title="Gentle nudges that protect relationships."
                  body="Send timely reminders so cashflow stays predictable, without sounding aggressive."
                />
              </div>

              <div
                className="lg:col-span-12 rounded-[var(--ti-landing-radius)] border bg-white p-7"
                style={{ borderColor: 'hsl(var(--ti-landing-border))', boxShadow: 'var(--ti-landing-shadow)' }}
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ti-landing-muted))]">
                      Financial insights
                    </div>
                    <div className="mt-3 text-xl font-semibold">Decisions backed by real cashflow.</div>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-[hsl(var(--ti-landing-muted))]">
                      Understand trends, outstanding balances, and collections—so you can plan confidently.
                    </p>
                  </div>
                  <div
                    className="rounded-2xl border bg-[hsl(var(--ti-landing-surface-2))] p-5"
                    style={{ borderColor: 'hsl(var(--ti-landing-border))' }}
                  >
                    <div className="text-sm font-semibold">Monthly summary</div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--ti-landing-muted))]">Invoiced</span>
                        <span className="font-semibold tabular-nums">R 96 300</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--ti-landing-muted))]">Collected</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'hsl(var(--ti-landing-accent))' }}>
                          R 71 540
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--ti-landing-muted))]">Outstanding</span>
                        <span className="font-semibold tabular-nums">R 24 180</span>
                      </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                      <div className="h-full w-[74%]" style={{ background: 'hsl(var(--ti-landing-accent))' }} />
                    </div>
                    <div className="mt-2 text-xs text-[hsl(var(--ti-landing-muted))]">74% collected this month</div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Pricing */}
        <Section id="pricing">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Eyebrow>Pricing</Eyebrow>
                <H2 className="mt-3">Simple, ZAR-priced plans.</H2>
                <PLead>Choose the level of automation you need. Upgrade as your volume grows.</PLead>
                <div className="mt-6 text-sm text-[hsl(var(--ti-landing-muted))]">
                  Built for SA businesses • VAT-aware totals • Secure payment links
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {pricing.map((p) =>
                  p.name === 'Business' ? (
                    <PricingCard
                      key={p.name}
                      name={p.name}
                      price={p.price}
                      hint={p.hint}
                      highlighted={p.highlighted}
                      features={p.features}
                      cta={p.cta}
                      onCta={() => window.open(WHATSAPP_HREF, '_blank', 'noopener,noreferrer')}
                    />
                  ) : (
                    <Link key={p.name} href={routes.auth.register} className="block">
                      <PricingCard
                        name={p.name}
                        price={p.price}
                        hint={p.hint}
                        highlighted={p.highlighted}
                        features={p.features}
                        cta={p.cta}
                      />
                    </Link>
                  )
                )}
              </div>
            </div>
          </Container>
        </Section>

        {/* FAQ */}
        <Section id="faq" className="pb-28">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Eyebrow>FAQ</Eyebrow>
                <H2 className="mt-3">Clear answers, no fluff.</H2>
                <PLead>Everything you need to know before you start.</PLead>
              </div>
              <FAQAccordion
                openIndex={faqOpen}
                onToggle={(i) => toggleFaq(i)}
                items={[
                  { q: 'Is TimelyInvoices built for South Africa?', a: 'Yes—ZAR pricing, SA-focused workflows, and VAT-aware totals.' },
                  { q: 'Do clients need an account to pay?', a: 'No. Clients open a secure link and pay without signing up.' },
                  { q: 'Can I export invoices and reports?', a: 'Yes. Export to CSV and print/save PDFs anytime.' },
                  { q: 'Can my team use it?', a: 'Yes. Business plans include team permissions so finance and ops can collaborate.' },
                ]}
              />
            </div>
          </Container>
        </Section>

        {/* Testimonials */}
        <Section>
          <Container>
            <Eyebrow>What customers say</Eyebrow>
            <H2 className="mt-3">Calm, credible, and built for SMEs.</H2>
            <PLead>Editorial quotes with just enough detail—no generic hype.</PLead>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <TestimonialQuote quote="Invoices look professional, and payment statuses stop the follow-up chaos." name="Nadia M." location="Cape Town" />
              <TestimonialQuote lift quote="The workflow feels clean. We send invoices faster and get paid sooner." name="Thabo S." location="Johannesburg" />
              <TestimonialQuote quote="Reminders are gentle but effective. Cashflow is more predictable month to month." name="Ayesha K." location="Durban" />
            </div>
          </Container>
        </Section>
      </main>
    </div>
  );
}

