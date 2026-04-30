'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, Check } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { Container, Eyebrow, H2, PLead, Reveal, Section } from '@/components/landing/landingPrimitives';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { DashboardPreviewCard } from '@/components/landing/DashboardPreviewCard';
import { cn } from '@/lib/utils/cn';

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function LandingCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn('rounded-xl border-border shadow-[var(--shadow-sm)]', className)} {...props} />;
}

function FAQItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="w-full text-left">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="text-sm font-semibold">{q}</div>
        <span className="text-xs font-semibold text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
      </div>
      {open ? <div className="px-4 pb-4 text-sm text-muted-foreground sm:px-5">{a}</div> : null}
    </button>
  );
}

export function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const toggleFaq = useCallback((i: number) => setFaqOpen((p) => (p === i ? null : i)), []);

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
        hint: 'Best for SA SMEs',
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
      <motion.a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_18px_44px_-10px_rgba(37,211,102,0.48)]"
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp us
      </motion.a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card shadow-[var(--shadow-sm)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="h-3.5 w-3.5 rounded-md bg-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-[0.95rem] font-semibold tracking-tight">TimelyInvoices</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">South Africa</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => scrollToId('pricing')}
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:inline-flex"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToId('faq')}
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:inline-flex"
            >
              FAQ
            </button>
            <Link href={routes.auth.login}>
              <Button variant="ghost" className="text-sm">
                Sign in
              </Button>
            </Link>
            <Link href={routes.auth.register} className="hidden sm:inline-flex">
              <Button size="md" className="px-5 shadow-[var(--shadow-sm)]">
                Start free
              </Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        {/* 1. Hero with dashboard preview */}
        <Section className="pt-16 sm:pt-20 lg:pt-24">
          <Container>
            <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="pt-2">
                <Reveal>
                  <Badge variant="outline" className="font-semibold">
                    Built for SA businesses
                  </Badge>
                </Reveal>
                <Reveal className="mt-6">
                  <h1 className="text-balance text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                    Get paid faster, with dashboard-level clarity.
                  </h1>
                  <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Send invoices, track payment status, and monitor cashflow in one place—clean, modern, and built for South
                    African SMEs.
                  </p>
                </Reveal>
                <Reveal className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href={routes.auth.register} className="w-full sm:w-auto">
                    <Button size="lg" className="h-12 w-full px-7 shadow-[var(--shadow-md)] sm:w-auto">
                      Start free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => scrollToId('product-showcase')}
                    className="h-12 w-full px-7 shadow-[var(--shadow-sm)] sm:w-auto"
                  >
                    View the product
                  </Button>
                </Reveal>

                <Reveal className="mt-8">
                  <LandingCard className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick signals</div>
                        <div className="mt-1 text-sm text-foreground">What you need, visible at a glance.</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">ZAR pricing</Badge>
                        <Badge variant="outline">Status badges</Badge>
                        <Badge variant="outline">Reminders</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-card p-3">
                        <div className="text-sm font-semibold">Paid / Outstanding / Overdue</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">Clear statuses across invoices and clients.</div>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3">
                        <div className="text-sm font-semibold">Collections workflow</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">Send → track → follow up → get paid.</div>
                      </div>
                    </div>
                  </LandingCard>
                </Reveal>
              </div>

              <div id="product-showcase" className="lg:pt-2">
                <DashboardPreviewCard />
              </div>
            </div>

            <div className="mt-12 border-t border-border/70 pt-8">
              <Eyebrow>Trusted by growing businesses</Eyebrow>
              <div className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-3 text-sm font-semibold text-muted-foreground">
                {['Cape Creative', 'Ubuntu Labs', 'Savannah Tech', 'Atlas Studio', 'Karoo Digital'].map((n) => (
                  <span key={n} className="opacity-80 transition-opacity hover:opacity-100">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* 2. Feature overview (avoid identical card grid) */}
        <Section>
          <Container>
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <Eyebrow>Product</Eyebrow>
                <H2 className="mt-3">Less admin. More momentum.</H2>
                <PLead>Everything you need to invoice, collect, and stay on top of cashflow—presented like the product itself.</PLead>
              </div>
              <div className="hidden lg:block text-sm text-muted-foreground">Clean UI • Real status badges • Useful defaults</div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <LandingCard className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
                  <div>
                    <div className="text-sm font-semibold">Smart invoicing</div>
                    <div className="mt-1 text-xs text-muted-foreground">A product-like preview instead of generic feature cards.</div>
                  </div>
                  <Badge variant="primary">Product UI</Badge>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice number</div>
                      <div className="mt-1 text-sm font-semibold">INV-10421</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</div>
                      <div className="mt-1 text-sm font-semibold">Cape Creative</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge status="draft" />
                        <StatusBadge status="sent" />
                        <StatusBadge status="paid" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { k: 'Design retainer', v: 'R 3 500' },
                          { k: 'Website updates', v: 'R 1 800' },
                          { k: 'VAT', v: 'R 795' },
                        ].map((r) => (
                          <TableRow key={r.k}>
                            <TableCell className="text-muted-foreground">{r.k}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{r.v}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </LandingCard>

              <div className="grid gap-3">
                <LandingCard className="p-4 sm:p-5">
                  <div className="text-sm font-semibold">Payment tracking</div>
                  <div className="mt-1 text-xs text-muted-foreground">Know what’s paid, what’s open, and what’s overdue.</div>
                  <div className="mt-4 space-y-2">
                    {[
                      { t: 'Outstanding', v: 'R 24 180', s: 'sent' as const },
                      { t: 'Overdue', v: 'R 8 920', s: 'overdue' as const },
                      { t: 'Paid', v: 'R 71 540', s: 'paid' as const },
                    ].map((r) => (
                      <div key={r.t} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{r.t}</div>
                          <div className="text-xs text-muted-foreground">Dashboard metric</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold tabular-nums">{r.v}</div>
                          <StatusBadge status={r.s} />
                        </div>
                      </div>
                    ))}
                  </div>
                </LandingCard>

                <LandingCard className="p-4 sm:p-5">
                  <div className="text-sm font-semibold">Automated reminders</div>
                  <div className="mt-1 text-xs text-muted-foreground">Practical follow-ups that keep cashflow predictable.</div>
                  <div className="mt-4 space-y-2">
                    {[
                      { k: 'Tone', v: 'Friendly, business-like' },
                      { k: 'Timing', v: 'Before + after due date' },
                      { k: 'Outcome', v: 'Fewer overdue invoices' },
                    ].map((r) => (
                      <div key={r.k} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                        <span className="text-muted-foreground">{r.k}</span>
                        <span className="font-semibold">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </LandingCard>
              </div>
            </div>
          </Container>
        </Section>

        {/* 3. Invoice workflow as product UI */}
        <Section>
          <Container>
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <div>
                <Eyebrow>Workflow</Eyebrow>
                <H2 className="mt-3">From draft to paid—without leaving the product.</H2>
                <PLead>Three simple steps, represented as UI blocks you’d actually see in TimelyInvoices.</PLead>
              </div>
              <LandingCard className="overflow-hidden p-0">
                <div className="border-b border-border p-4 sm:p-5">
                  <div className="text-sm font-semibold">Invoice timeline</div>
                  <div className="mt-1 text-xs text-muted-foreground">Actions and status updates stay visible</div>
                </div>
                <div className="space-y-2 p-4 sm:p-5">
                  {[
                    { t: 'Create invoice', s: 'draft' as const, d: 'Add line items and client details.' },
                    { t: 'Send to client', s: 'sent' as const, d: 'Email a secure link and track views.' },
                    { t: 'Receive payment', s: 'paid' as const, d: 'Status updates and reflects in dashboard.' },
                  ].map((r) => (
                    <div key={r.t} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3">
                      <div>
                        <div className="text-sm font-semibold">{r.t}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{r.d}</div>
                      </div>
                      <StatusBadge status={r.s} />
                    </div>
                  ))}
                </div>
              </LandingCard>
            </div>
          </Container>
        </Section>

        {/* 4. Dashboard preview section with list/table previews */}
        <Section>
          <Container>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <LandingCard className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
                  <div>
                    <div className="text-sm font-semibold">Invoice list</div>
                    <div className="mt-1 text-xs text-muted-foreground">Built with the same table styling as the dashboard</div>
                  </div>
                  <Badge variant="outline" className="font-normal">
                    Status
                  </Badge>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { inv: 'INV-10418', client: 'Karoo Digital', status: 'sent' as const, amt: 'R 5 800' },
                          { inv: 'INV-10407', client: 'Ubuntu Labs', status: 'paid' as const, amt: 'R 12 400' },
                          { inv: 'INV-10391', client: 'Cape Creative', status: 'overdue' as const, amt: 'R 3 120' },
                        ].map((r) => (
                          <TableRow key={r.inv}>
                            <TableCell className="font-semibold text-foreground">{r.inv}</TableCell>
                            <TableCell className="text-muted-foreground">{r.client}</TableCell>
                            <TableCell>
                              <StatusBadge status={r.status} />
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{r.amt}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </LandingCard>

              <div className="grid gap-3">
                <LandingCard className="p-4 sm:p-5">
                  <div className="text-sm font-semibold">Client summary</div>
                  <div className="mt-1 text-xs text-muted-foreground">Who owes you money, and how much.</div>
                  <div className="mt-4 space-y-2">
                    {[
                      { c: 'Karoo Digital', v: 'R 5 800', s: 'sent' as const },
                      { c: 'Cape Creative', v: 'R 3 120', s: 'overdue' as const },
                      { c: 'Ubuntu Labs', v: 'R 0', s: 'paid' as const },
                    ].map((r) => (
                      <div key={r.c} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{r.c}</div>
                          <div className="text-xs text-muted-foreground">Last invoice status</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold tabular-nums">{r.v}</div>
                          <StatusBadge status={r.s} />
                        </div>
                      </div>
                    ))}
                  </div>
                </LandingCard>

                <LandingCard className="p-4 sm:p-5">
                  <div className="text-sm font-semibold">Payment status</div>
                  <div className="mt-1 text-xs text-muted-foreground">Clear badges across the product.</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['draft', 'sent', 'paid', 'overdue'] as const).map((s) => (
                      <StatusBadge key={s} status={s} />
                    ))}
                  </div>
                </LandingCard>
              </div>
            </div>
          </Container>
        </Section>

        {/* 5. Pricing using dashboard-style panels */}
        <Section id="pricing">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Eyebrow>Pricing</Eyebrow>
                <H2 className="mt-3">Simple, ZAR-priced plans.</H2>
                <PLead>Keep it lightweight. Upgrade when you need automation and reporting.</PLead>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {pricing.map((p) => (
                  <LandingCard
                    key={p.name}
                    className={cn('p-5', p.highlighted && 'ring-1 ring-primary/20 shadow-[var(--shadow-md)]')}
                  >
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.hint}</div>
                    <div className="mt-4 text-3xl font-semibold tabular-nums">
                      {p.price}
                      <span className="text-sm font-medium text-muted-foreground">/mo</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">
                      {p.name === 'Business' ? (
                        <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
                          <Button variant="secondary" className="w-full shadow-[var(--shadow-sm)]">
                            {p.cta}
                          </Button>
                        </a>
                      ) : (
                        <Link href={routes.auth.register}>
                          <Button className="w-full shadow-[var(--shadow-sm)]" variant={p.highlighted ? 'primary' : 'secondary'}>
                            {p.cta}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </LandingCard>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* 6. FAQ using clean dashboard accordion styling */}
        <Section id="faq">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Eyebrow>FAQ</Eyebrow>
                <H2 className="mt-3">Clear answers, no fluff.</H2>
                <PLead>Short, practical answers—like the dashboard UI.</PLead>
              </div>
              <LandingCard className="overflow-hidden p-0">
                {[
                  { q: 'Is TimelyInvoices built for South Africa?', a: 'Yes—ZAR pricing, SA-focused workflows, and VAT-aware invoice totals.' },
                  { q: 'Do clients need an account to pay?', a: 'No. Clients can pay from a secure link without signing up.' },
                  { q: 'Can I export invoices and reports?', a: 'Yes. Export to CSV and print/save PDFs anytime.' },
                  { q: 'Can my team use it?', a: 'Yes. Team permissions are available on higher plans.' },
                ].map((it, i) => (
                  <div key={it.q} className={cn(i !== 0 && 'border-t border-border')}>
                    <FAQItem q={it.q} a={it.a} open={faqOpen === i} onToggle={() => toggleFaq(i)} />
                  </div>
                ))}
              </LandingCard>
            </div>
          </Container>
        </Section>

        {/* 7. CTA using the same dashboard visual language */}
        <Section className="pt-0">
          <Container>
            <LandingCard className="p-6 sm:p-7">
              <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="text-sm font-semibold">Ready to send your next invoice?</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Start free and keep everything visible—from invoice status to cash collected.
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href={routes.auth.register}>
                    <Button size="lg" className="shadow-[var(--shadow-md)]">
                      Start free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
                    <Button size="lg" variant="secondary" className="shadow-[var(--shadow-sm)]">
                      Talk to us
                    </Button>
                  </a>
                </div>
              </div>
            </LandingCard>

            <footer className="mt-10 pb-14 text-sm text-muted-foreground">
              <div className="grid gap-10 border-t border-border/70 pt-10 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">TimelyInvoices</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Invoicing and cashflow software for South African businesses.
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</div>
                  <div className="mt-3 grid gap-2">
                    <button className="text-left hover:text-foreground" onClick={() => scrollToId('product-showcase')} type="button">
                      Overview
                    </button>
                    <button className="text-left hover:text-foreground" onClick={() => scrollToId('pricing')} type="button">
                      Pricing
                    </button>
                    <button className="text-left hover:text-foreground" onClick={() => scrollToId('faq')} type="button">
                      FAQ
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</div>
                  <div className="mt-3 grid gap-2">
                    <span>South Africa</span>
                    <span>ZAR pricing</span>
                    <span>Support via WhatsApp</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal</div>
                  <div className="mt-3 grid gap-2">
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Contact</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} TimelyInvoices. All rights reserved.</div>
            </footer>
          </Container>
        </Section>
      </main>
    </div>
  );
}

