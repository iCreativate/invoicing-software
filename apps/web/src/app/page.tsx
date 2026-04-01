import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  FileText,
  LineChart,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  GitBranch,
  Globe,
  Cpu,
  LayoutGrid,
} from 'lucide-react';

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

const motionStagger = 'motion-safe:[animation-delay:calc(var(--stagger,0)*60ms)] motion-safe:animate-[ti-fade-up_0.6s_ease-out_both]';

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      {/* Ambient layers — richer colour washes */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(1400px_720px_at_12%_-8%,hsl(var(--primary)/0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_88%_0%,rgba(79,70,229,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_480px_at_20%_55%,rgba(34,211,238,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(600px_420px_at_95%_60%,rgba(251,146,60,0.1),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_100%,hsl(var(--primary)/0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,hsl(var(--muted)/0.45)_100%)] dark:bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_100%)]" />
      </div>

      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(37,211,102,0.4)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:bottom-8 sm:right-8"
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp us
      </a>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-violet-500/15 shadow-[var(--shadow-sm)] transition group-hover:shadow-[var(--shadow-md)] dark:border-blue-500/30">
              <Sparkles className="h-[1.15rem] w-[1.15rem] text-blue-600 dark:text-blue-400" />
            </div>
            <div className="leading-tight">
              <div className="text-[0.9375rem] font-semibold tracking-tight">TimelyInvoices</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">South Africa</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="/#pricing"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/80 hover:text-foreground md:inline-flex"
            >
              Pricing
            </a>
            <Link href={routes.auth.login}>
              <Button variant="ghost" className="text-sm">
                Sign in
              </Button>
            </Link>
            <Link href={routes.auth.register} className="hidden sm:inline-flex">
              <Button variant="primary" className="px-5 shadow-[var(--shadow-md)]">
                Start free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <main>
          {/* Hero — Jira-style outcome headline + premium product frame */}
          <section className="relative pt-14 pb-20 sm:pt-20 sm:pb-28 lg:pt-24">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2]"
              aria-hidden
              style={{
                backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)',
              }}
            />
            <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-16">
              <div className="space-y-8">
                <div
                  className={`inline-flex flex-wrap items-center gap-2 ${motionStagger}`}
                  style={{ ['--stagger' as string]: '0' }}
                >
                  <Badge variant="primary" className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                    ZAR-first
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-300/80 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
                  >
                    10 free invoices / month
                  </Badge>
                </div>
                <div className="space-y-6" style={{ ['--stagger' as string]: '1' }}>
                  <h1
                    className={`max-w-[20ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:max-w-none sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02] ${motionStagger}`}
                  >
                    Focus on revenue,{' '}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                      not admin.
                    </span>
                  </h1>
                  <p
                    className={`max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed ${motionStagger}`}
                    style={{ ['--stagger' as string]: '2' }}
                  >
                    Invoicing, payments, and client portals—built for how South African businesses actually work. PayFast,
                    SnapScan, VAT-ready PDFs, and a dashboard that answers “who owes me?” in one glance.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center" style={{ ['--stagger' as string]: '3' }}>
                  <Link href={routes.auth.register} className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="h-12 w-full px-8 text-[15px] shadow-[0_8px_32px_-4px_rgba(37,99,235,0.45)] sm:w-auto">
                      Start free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={routes.auth.login} className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="h-12 w-full border border-border/80 bg-card/90 backdrop-blur sm:w-auto">
                      Sign in
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/80">Using a work email?</span> It keeps billing and client comms in
                  one professional place—like the tools you already trust for serious work.
                </p>
              </div>

              {/* Product preview stack */}
              <div className="relative lg:pl-4">
                <div
                  className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-indigo-500/10 blur-2xl"
                  aria-hidden
                />
                <div className="relative space-y-4">
                  <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card/95 to-card/80 p-1 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.5)]">
                    <div className="rounded-[calc(var(--radius)+10px)] border border-border/40 bg-background/50 p-6 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Dashboard</div>
                          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">R 24,180.00</div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">Outstanding · this month</div>
                        </div>
                        <div className="rounded-xl border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                          +12% vs last month
                        </div>
                      </div>
                      <div className="mt-8 grid grid-cols-3 gap-3">
                        {[
                          {
                            l: 'Sent',
                            v: '12',
                            wrap: 'border-sky-200/90 bg-sky-50/90 dark:border-sky-500/35 dark:bg-sky-500/15',
                            c: 'text-sky-700 dark:text-sky-300',
                          },
                          {
                            l: 'Paid',
                            v: '7',
                            wrap: 'border-emerald-200/90 bg-emerald-50/90 dark:border-emerald-500/35 dark:bg-emerald-500/15',
                            c: 'text-emerald-700 dark:text-emerald-300',
                          },
                          {
                            l: 'Overdue',
                            v: '2',
                            wrap: 'border-rose-200/90 bg-rose-50/90 dark:border-rose-500/35 dark:bg-rose-500/15',
                            c: 'text-rose-700 dark:text-rose-300',
                          },
                        ].map((x) => (
                          <div
                            key={x.l}
                            className={`rounded-2xl border p-3 shadow-[var(--shadow-sm)] ${x.wrap}`}
                          >
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{x.l}</div>
                            <div className={`mt-1 text-xl font-semibold tabular-nums ${x.c}`}>{x.v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-4 text-sm leading-snug text-muted-foreground dark:border-violet-500/30">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                        <span>Clients pay from a secure link—no bank details floating in email threads.</span>
                      </div>
                    </div>
                  </Card>
                  <div className="flex justify-end pr-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 text-xs font-medium text-amber-950/80 shadow-[var(--shadow-sm)] backdrop-blur dark:border-amber-500/35 dark:from-amber-500/15 dark:to-orange-500/10 dark:text-amber-100/90">
                      <Cpu className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      AI-assisted drafting on Business
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust strip — logo-row energy */}
          <section className="border-y border-border/50 bg-gradient-to-r from-sky-500/[0.06] via-violet-500/[0.07] to-amber-500/[0.06] py-10 backdrop-blur-sm dark:from-sky-500/10 dark:via-violet-500/10 dark:to-amber-500/10">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Built for South African operators
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {[
                { t: 'VAT-ready', pill: 'border-emerald-300/70 bg-emerald-500/15 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-100' },
                { t: 'POPIA-conscious', pill: 'border-violet-300/70 bg-violet-500/12 text-violet-900 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-100' },
                { t: 'PayFast', pill: 'border-sky-300/70 bg-sky-500/15 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/45 dark:text-sky-100' },
                { t: 'SnapScan', pill: 'border-fuchsia-300/70 bg-fuchsia-500/12 text-fuchsia-900 dark:border-fuchsia-500/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-100' },
                { t: 'Client portal', pill: 'border-amber-300/70 bg-amber-500/15 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100' },
              ].map(({ t, pill }) => (
                <div
                  key={t}
                  className={`rounded-full border px-5 py-2.5 text-xs font-semibold shadow-[var(--shadow-sm)] backdrop-blur-md ${pill}`}
                >
                  {t}
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
              TimelyInvoices is not a government-certified product—we engineer for SARS-style VAT clarity and privacy-first
              defaults so your books stay defensible.
            </p>
          </section>

          {/* Pull quote */}
          <section className="py-20 sm:py-28">
            <blockquote className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-indigo-200/60 bg-gradient-to-br from-indigo-500/[0.09] via-card to-cyan-500/[0.08] px-6 py-12 text-center shadow-[var(--shadow-md)] dark:border-indigo-500/25 dark:from-indigo-500/15 dark:via-card dark:to-cyan-500/10 sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -right-12 -top-8 h-32 w-32 rounded-full bg-indigo-400/25 blur-2xl" aria-hidden />
              <p className="relative text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl sm:leading-snug lg:text-[2.125rem] lg:leading-[1.25]">
                “Finally, one place for{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">
                  invoices, payments, and client status
                </span>
                —without living in spreadsheets.”
              </p>
              <footer className="relative mt-8 text-sm font-medium text-muted-foreground">
                Teams who invoice weekly · agencies, studios, consultants
              </footer>
            </blockquote>
          </section>

          {/* Bento features */}
          <section className="pb-20 sm:pb-28">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex rounded-full bg-gradient-to-r from-blue-600/15 via-violet-600/15 to-fuchsia-600/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                Platform
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Everything to invoice, collect, and reconcile</h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                A cohesive workspace—not a patchwork of PDFs and payment links.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
              <Card className="group relative overflow-hidden border-blue-200/50 bg-gradient-to-br from-blue-500/[0.08] via-card to-indigo-500/[0.06] p-8 shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] dark:border-blue-500/20 lg:col-span-7 lg:row-span-2 lg:p-10">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl transition group-hover:bg-blue-400/30 dark:bg-blue-500/20" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-700 ring-1 ring-blue-400/30 dark:text-blue-300">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="relative mt-6 text-xl font-semibold tracking-tight">Invoices that feel expensive</h3>
                <p className="relative mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                  Logo, banking details, VAT lines, and PDF output that matches your brand—so finance stops asking for
                  “the other version.”
                </p>
              </Card>
              <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-500/[0.07] to-card p-7 shadow-[var(--shadow-sm)] transition hover:border-emerald-300/60 hover:shadow-[var(--shadow-md)] dark:border-emerald-500/25 lg:col-span-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/25 dark:text-emerald-300">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">PayFast + SnapScan</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Pay Now on every invoice. Cards and EFT via PayFast; instant QR flows with SnapScan.
                </p>
              </Card>
              <Card className="border-fuchsia-200/50 bg-gradient-to-br from-fuchsia-500/[0.07] to-card p-7 shadow-[var(--shadow-sm)] transition hover:border-fuchsia-300/60 hover:shadow-[var(--shadow-md)] dark:border-fuchsia-500/25 lg:col-span-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-700 ring-1 ring-fuchsia-400/25 dark:text-fuchsia-300">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">Branded client portal</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Mobile-first experience: invoice list, optional password, pay in one tap.
                </p>
              </Card>
              <Card className="border-cyan-200/50 bg-gradient-to-br from-cyan-500/[0.07] to-card p-7 shadow-[var(--shadow-sm)] transition hover:border-cyan-300/60 hover:shadow-[var(--shadow-md)] dark:border-cyan-500/25 lg:col-span-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-400/25 dark:text-cyan-300">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">Cash-flow clarity</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Outstanding, overdue, and revenue signals on your dashboard.
                </p>
              </Card>
              <Card className="border-amber-200/50 bg-gradient-to-br from-amber-500/[0.09] to-card p-7 shadow-[var(--shadow-sm)] transition hover:border-amber-300/60 hover:shadow-[var(--shadow-md)] dark:border-amber-500/25 lg:col-span-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 ring-1 ring-amber-400/30 dark:text-amber-300">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">Smart automation</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Reminders, AI-assisted drafting, and pricing memory on higher tiers.
                </p>
              </Card>
              <Card className="border-violet-200/50 bg-gradient-to-br from-violet-500/[0.07] to-card p-7 shadow-[var(--shadow-sm)] transition hover:border-violet-300/60 hover:shadow-[var(--shadow-md)] dark:border-violet-500/25 lg:col-span-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 ring-1 ring-violet-400/25 dark:text-violet-300">
                  <GitBranch className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">Team-ready (Business)</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Payroll hooks and permissions—solo today, small team tomorrow.
                </p>
              </Card>
            </div>
          </section>

          {/* Numbered pillars */}
          <section className="rounded-[2rem] border border-border/60 bg-gradient-to-b from-rose-500/[0.06] via-muted/30 to-sky-500/[0.06] px-6 py-16 dark:from-rose-500/10 dark:via-muted/20 dark:to-sky-500/10 sm:px-10 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-sky-500/20 ring-1 ring-rose-400/20">
                <LayoutGrid className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">From draft to paid—in three moves</h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Create in under a minute',
                  body: 'Client, line items, VAT—calculated for you. Save a draft or send immediately.',
                  accent: 'border-t-4 border-t-rose-400 bg-gradient-to-b from-rose-500/[0.07] to-card dark:border-t-rose-500 dark:from-rose-500/10',
                  num: 'text-rose-600 dark:text-rose-400',
                },
                {
                  step: '02',
                  title: 'Share a secure link',
                  body: 'Professional invoice page with PayFast and SnapScan—no manual EFT chasing.',
                  accent: 'border-t-4 border-t-violet-400 bg-gradient-to-b from-violet-500/[0.07] to-card dark:border-t-violet-500 dark:from-violet-500/10',
                  num: 'text-violet-600 dark:text-violet-400',
                },
                {
                  step: '03',
                  title: 'Watch status update',
                  body: 'Payments sync back so you always know what is outstanding.',
                  accent: 'border-t-4 border-t-sky-400 bg-gradient-to-b from-sky-500/[0.07] to-card dark:border-t-sky-500 dark:from-sky-500/10',
                  num: 'text-sky-600 dark:text-sky-400',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`relative rounded-2xl border border-border/60 p-8 shadow-[var(--shadow-sm)] backdrop-blur-sm ${s.accent}`}
                >
                  <div className={`font-mono text-[11px] font-bold ${s.num}`}>{s.step}</div>
                  <div className="mt-4 text-lg font-semibold tracking-tight">{s.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Segments */}
          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex rounded-full bg-gradient-to-r from-orange-500/15 to-teal-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-800 dark:text-orange-200">
                Audience
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One product. Three ways to win.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'Freelancers',
                  body: 'Quotes to invoice in minutes, your brand on every PDF, Pay Now so you are not the “please EFT” person.',
                  card: 'border-orange-200/60 bg-gradient-to-b from-orange-500/[0.08] to-card dark:border-orange-500/25',
                  iconWrap: 'from-orange-500/25 to-amber-500/15 ring-orange-400/30',
                  iconColor: 'text-orange-600 dark:text-orange-400',
                },
                {
                  icon: Building2,
                  title: 'Small business',
                  body: 'VAT, banking details, and payment tracking without a full accounting stack.',
                  card: 'border-teal-200/60 bg-gradient-to-b from-teal-500/[0.08] to-card dark:border-teal-500/25',
                  iconWrap: 'from-teal-500/25 to-emerald-500/15 ring-teal-400/30',
                  iconColor: 'text-teal-700 dark:text-teal-400',
                },
                {
                  icon: Globe,
                  title: 'Agencies',
                  body: 'Client portal, consistent templates, and headroom for team workflows on Business.',
                  card: 'border-indigo-200/60 bg-gradient-to-b from-indigo-500/[0.08] to-card dark:border-indigo-500/25',
                  iconWrap: 'from-indigo-500/25 to-violet-500/15 ring-indigo-400/30',
                  iconColor: 'text-indigo-700 dark:text-indigo-400',
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className={`p-8 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${item.card}`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${item.iconWrap}`}
                  >
                    <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Dark premium band — comparison + CTA teaser */}
          <section className="relative mb-20 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950 px-6 py-16 text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_32px_80px_-24px_rgba(15,23,42,0.7)] sm:px-10 sm:py-20 dark:border-slate-800">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_400px_at_80%_0%,rgba(99,102,241,0.28),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_360px_at_10%_90%,rgba(34,211,238,0.12),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_300px_at_95%_85%,rgba(244,114,182,0.1),transparent_40%)]" />
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Why teams leave spreadsheets behind</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
                TimelyInvoices is purpose-built for ZA workflows—not a generic global afterthought.
              </p>
            </div>
            <div className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    <th className="px-5 py-4">Capability</th>
                    <th className="px-5 py-4 text-indigo-300">TimelyInvoices</th>
                    <th className="px-5 py-4">Sheets</th>
                    <th className="px-5 py-4">Global tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {[
                    { cap: 'ZA VAT-first line items', timely: true, sheet: false, other: 'Sometimes' },
                    { cap: 'PayFast + SnapScan checkout', timely: true, sheet: false, other: 'Varies' },
                    { cap: 'Branded client portal', timely: true, sheet: false, other: 'Often add-on' },
                    { cap: 'Payment + invoice status sync', timely: true, sheet: false, other: 'Sometimes' },
                    { cap: 'Generous free tier (10 / mo)', timely: true, sheet: true, other: 'Rare' },
                  ].map((row) => (
                    <tr key={row.cap} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-medium text-slate-200">{row.cap}</td>
                      <td className="px-5 py-3.5">
                        {row.timely ? <Check className="h-5 w-5 text-emerald-400" /> : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {row.sheet ? <Check className="h-5 w-5 text-slate-500" /> : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{row.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={routes.auth.register}>
                <Button variant="primary" className="h-12 px-8">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="/#pricing"
                className="text-sm font-semibold text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
              >
                View pricing →
              </a>
            </div>
          </section>

          {/* Testimonials */}
          <section className="pb-20 sm:pb-28">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              <span className="text-pink-600 dark:text-pink-400">Loved</span>{' '}
              <span className="text-foreground">by operators on the ground</span>
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  q: 'We moved off Excel. Clients pay from the link and we see status update live. Game changer.',
                  a: 'Nomsa K.',
                  r: 'Studio owner, JHB',
                },
                {
                  q: 'VAT on line items and a clean PDF meant fewer queries from finance. Saves hours.',
                  a: 'David L.',
                  r: 'Consulting, Cape Town',
                },
                {
                  q: 'The portal feels premium—our agency brand stays consistent end-to-end.',
                  a: 'Priya N.',
                  r: 'Creative agency',
                },
              ].map((t, i) => {
                const rims = [
                  'border-l-4 border-l-pink-400 bg-gradient-to-r from-pink-500/[0.06] to-card dark:border-l-pink-500 dark:from-pink-500/10',
                  'border-l-4 border-l-teal-400 bg-gradient-to-r from-teal-500/[0.06] to-card dark:border-l-teal-500 dark:from-teal-500/10',
                  'border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-500/[0.07] to-card dark:border-l-amber-500 dark:from-amber-500/10',
                ];
                return (
                  <Card key={t.a} className={`border-border/60 p-8 shadow-[var(--shadow-sm)] ${rims[i] ?? ''}`}>
                    <p className="text-[15px] leading-relaxed text-foreground">“{t.q}”</p>
                    <div className="mt-6 border-t border-border/50 pt-5">
                      <div className="text-sm font-semibold">{t.a}</div>
                      <div className="text-xs font-medium text-muted-foreground">{t.r}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Pricing */}
          <section className="scroll-mt-24 pb-24" id="pricing">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex rounded-full bg-gradient-to-r from-violet-600/15 to-blue-600/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
                Pricing
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Simple tiers. No surprises.</h2>
              <p className="mt-4 text-base text-muted-foreground">
                Start free. Upgrade when volume and polish matter—Starter, Pro, and Business scale with you.
              </p>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-4">
              {[
                {
                  name: 'FREE',
                  price: 'R0',
                  sub: '10 invoices / month',
                  feats: ['Branding on docs', 'Core invoicing', 'Client list'],
                  cta: 'Start free',
                  highlight: false,
                  variant: 'secondary' as const,
                },
                {
                  name: 'STARTER',
                  price: 'R59',
                  sub: '/ month · sweet spot',
                  feats: ['Unlimited invoices', 'Remove branding', 'Basic automation'],
                  cta: 'Get Starter',
                  highlight: true,
                  variant: 'primary' as const,
                },
                {
                  name: 'PRO',
                  price: 'R129',
                  sub: '/ month',
                  feats: ['PayFast, Ozow roadmap', 'VAT features', 'Reports & time'],
                  cta: 'Go Pro',
                  highlight: false,
                  variant: 'secondary' as const,
                },
                {
                  name: 'BUSINESS',
                  price: 'R249',
                  sub: '/ month',
                  feats: ['AI features', 'Teams', 'Analytics & API'],
                  cta: 'Talk Business',
                  highlight: false,
                  variant: 'secondary' as const,
                },
              ].map((p) => (
                <Card
                  key={p.name}
                  className={`relative flex flex-col overflow-hidden border-border/60 p-7 transition hover:shadow-[var(--shadow-md)] ${
                    p.highlight
                      ? 'z-10 border-primary/25 bg-gradient-to-b from-primary/[0.12] via-indigo-500/[0.06] to-card shadow-[0_20px_50px_-20px_rgba(37,99,235,0.4)] ring-2 ring-primary/25 lg:scale-[1.02]'
                      : p.name === 'FREE'
                        ? 'border-slate-200/80 bg-gradient-to-b from-slate-500/[0.05] to-card shadow-[var(--shadow-sm)] dark:border-slate-700'
                        : p.name === 'PRO'
                          ? 'border-cyan-200/60 bg-gradient-to-b from-cyan-500/[0.06] to-card shadow-[var(--shadow-sm)] dark:border-cyan-500/25'
                          : 'border-violet-200/60 bg-gradient-to-b from-violet-500/[0.07] to-card shadow-[var(--shadow-sm)] dark:border-violet-500/25'
                  }`}
                >
                  {p.highlight ? (
                    <div className="absolute right-4 top-4">
                      <Badge variant="primary" className="rounded-full text-[10px]">
                        Most popular
                      </Badge>
                    </div>
                  ) : null}
                  <div className={`text-xs font-bold tracking-wider ${p.highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.name}
                  </div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                    {p.name !== 'FREE' ? <span className="text-sm font-medium text-muted-foreground">/ mo</span> : null}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{p.sub}</div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {p.feats.map((f) => (
                      <li key={f} className="flex gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={routes.auth.register} className="block">
                      <Button variant={p.variant} className="h-11 w-full">
                        {p.cta} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="pb-20">
            <div className="relative overflow-hidden rounded-[2rem] border border-indigo-200/50 bg-gradient-to-br from-blue-500/[0.14] via-violet-500/[0.08] to-fuchsia-500/[0.12] p-10 shadow-[var(--shadow-lg)] dark:border-indigo-500/30 sm:p-14">
              <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
              <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
              <div className="pointer-events-none absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to look unmistakably professional?</h2>
                <p className="mt-4 text-base text-muted-foreground">
                  Join on the free tier—10 invoices a month with full polish—or choose a paid plan when you are ready to scale.
                </p>
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
                  <Link href={routes.auth.register}>
                    <Button variant="primary" className="h-12 w-full px-10 sm:w-auto">
                      Start free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="h-12 w-full border-border/80 bg-background/80 sm:w-auto">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp sales
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-transparent bg-gradient-to-r from-transparent via-border to-transparent py-12 pt-14">
          <div className="mx-auto mb-10 h-px max-w-xs bg-gradient-to-r from-blue-500/0 via-fuchsia-500/50 to-amber-500/0" aria-hidden />
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
                <span className="font-semibold">TimelyInvoices</span>
              </div>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">Invoicing and payments for South African businesses.</p>
              <p className="mt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} TimelyInvoices</p>
            </div>
            <div className="flex flex-wrap gap-10 text-sm">
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product</div>
                <Link href={routes.auth.register} className="block text-muted-foreground hover:text-foreground">
                  Sign up
                </Link>
                <Link href={routes.auth.login} className="block text-muted-foreground hover:text-foreground">
                  Log in
                </Link>
                <a href="/#pricing" className="block text-muted-foreground hover:text-foreground">
                  Pricing
                </a>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</div>
                <a href={WHATSAPP_HREF} className="block text-muted-foreground hover:text-foreground" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
