'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChevronDown,
  FileText,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

const navy = '#0B1C2C';
const accent = '#00C48C';
const indigo = '#4F46E5';
const pageBg = '#F8FAFC';

/** Primary CTA: inset highlight + outer glow */
const primaryBtnClass =
  'relative overflow-hidden rounded-2xl font-semibold text-white transition-all duration-300 ' +
  'shadow-[0_1px_0_0_rgba(255,255,255,0.22)_inset,0_10px_36px_-6px_rgba(0,196,140,0.5)] ' +
  'hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.28)_inset,0_16px_48px_-8px_rgba(0,196,140,0.55)] ' +
  'active:translate-y-0 active:shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_28px_-6px_rgba(0,196,140,0.45)]';

const secondaryBtnClass =
  'rounded-2xl border border-slate-200/90 bg-white font-semibold text-[#0B1C2C] transition-all duration-300 ' +
  'shadow-[0_1px_2px_rgba(11,28,44,0.04),0_8px_28px_-10px_rgba(79,70,229,0.12)] ' +
  'hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50/90 hover:shadow-[0_1px_2px_rgba(11,28,44,0.06),0_14px_40px_-12px_rgba(79,70,229,0.18)] ' +
  'active:translate-y-0';


const heroContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
};

const heroEase = [0.22, 1, 0.36, 1] as const;

const heroItem = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: heroEase },
  },
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const toggleFaq = useCallback((i: number) => {
    setFaqOpen((prev) => (prev === i ? null : i));
  }, []);

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden antialiased"
      style={{ backgroundColor: pageBg, color: navy, fontFamily: 'inherit' }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Base wash + vertical depth */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${pageBg} 0%, #eef2f7 42%, #f4f7fb 70%, ${pageBg} 100%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            background: `radial-gradient(ellipse 90% 45% at 50% -8%, rgba(79, 70, 229, 0.09), transparent 55%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse 70% 40% at 100% 25%, rgba(0, 196, 140, 0.07), transparent 50%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background: `radial-gradient(ellipse 55% 35% at 0% 60%, rgba(79, 70, 229, 0.06), transparent 50%)`,
          }}
        />
        {/* Soft orbs */}
        <div
          className="absolute -left-[18%] top-[-8%] h-[560px] w-[72%] rounded-full opacity-[0.16] blur-3xl"
          style={{ background: `linear-gradient(135deg, ${indigo}, ${accent})` }}
        />
        <div
          className="absolute -right-[12%] top-[28%] h-[440px] w-[58%] rounded-full opacity-[0.11] blur-3xl"
          style={{ background: `linear-gradient(200deg, ${accent}, ${indigo})` }}
        />
        <div
          className="absolute bottom-[-5%] left-[25%] h-[420px] w-[55%] rounded-full opacity-[0.09] blur-3xl"
          style={{ background: indigo }}
        />
        {/* Fine grain (very subtle) */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      </div>

      <motion.a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 flex max-w-[calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-2rem)] items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_14px_40px_-6px_rgba(37,211,102,0.55)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:bottom-[max(2rem,env(safe-area-inset-bottom))] sm:right-[max(2rem,env(safe-area-inset-right))]"
        style={{ backgroundColor: '#25D366' }}
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp us
      </motion.a>

      <header
        className="sticky top-0 z-40 border-b border-slate-200/60 backdrop-blur-2xl backdrop-saturate-150"
        style={{
          background: 'linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(248,250,252,0.78) 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 shadow-md transition duration-300 group-hover:scale-[1.04] group-hover:shadow-lg"
              style={{
                background: `linear-gradient(145deg, ${navy} 0%, #132f47 100%)`,
                boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 24px -8px rgba(11,28,44,0.35)',
              }}
            >
              <Layers className="h-[1.15rem] w-[1.15rem] text-white transition-transform duration-300 group-hover:rotate-[-6deg]" />
            </div>
            <div className="leading-tight">
              <div className="text-[0.9375rem] font-semibold tracking-tight" style={{ color: navy }}>
                TimelyInvoices
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">South Africa</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => scrollToId('pricing')}
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-[#0B1C2C] md:inline-flex"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToId('faq')}
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-[#0B1C2C] lg:inline-flex"
            >
              FAQ
            </button>
            <Link href={routes.auth.login}>
              <Button variant="ghost" className="text-sm text-slate-500 transition-colors hover:text-[#0B1C2C]">
                Sign in
              </Button>
            </Link>
            <Link href={routes.auth.register} className="hidden sm:inline-flex">
              <Button
                size="md"
                className={cn(
                  'rounded-xl px-5 font-semibold text-white',
                  primaryBtnClass,
                  'hover:brightness-[1.02]'
                )}
                style={{ background: `linear-gradient(145deg, ${accent} 0%, #00a876 48%, #00966a 100%)` }}
              >
                Start free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <main>
          {/* Hero */}
          <section className="relative pt-20 pb-28 sm:pt-28 sm:pb-36 lg:pt-32 lg:pb-40">
            <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
              <motion.div className="space-y-10" initial="hidden" animate="show" variants={heroContainer}>
                <motion.div variants={heroItem}>
                  <span
                    className="inline-flex rounded-full border border-slate-200/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
                    }}
                  >
                    Built for SA businesses
                  </span>
                </motion.div>
                <motion.div className="space-y-6" variants={heroItem}>
                  <h1 className="max-w-[16ch] text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.038em] text-[#0B1C2C] sm:max-w-none sm:text-5xl sm:leading-[1.05] lg:text-[3.65rem] lg:tracking-[-0.04em]">
                    Get Paid Faster.{' '}
                    <span
                      className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#00C48C] bg-clip-text text-transparent"
                    >
                      Run Smarter.
                    </span>
                  </h1>
                  <p className="max-w-xl text-lg font-normal leading-[1.7] text-slate-500 sm:text-xl sm:leading-[1.75]">
                    Smart invoicing built for modern South African businesses—professional, fast, and designed to turn
                    sent invoices into cash in the bank.
                  </p>
                </motion.div>
                <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center" variants={heroItem}>
                  <Link href={routes.auth.register} className="group relative w-full sm:w-auto">
                    <Button
                      size="lg"
                      className={cn(
                        'h-[3.25rem] w-full px-8 text-[15px] sm:w-auto',
                        primaryBtnClass
                      )}
                      style={{ background: `linear-gradient(145deg, ${accent} 0%, #00b37a 48%, #009e6e 100%)` }}
                    >
                      Start Free{' '}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => scrollToId('product-showcase')}
                    className={cn('h-[3.25rem] w-full px-8 text-[15px] sm:w-auto', secondaryBtnClass)}
                  >
                    See Demo
                  </Button>
                </motion.div>
                <motion.p className="text-sm font-normal text-slate-400" variants={heroItem}>
                  No credit card to start. Upgrade when your volume grows.
                </motion.p>
              </motion.div>

              <motion.div
                className="relative lg:pl-2"
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.12, ease: heroEase }}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 260, damping: 28 } }}
              >
                <div
                  className="absolute -inset-4 rounded-[1.85rem] opacity-50 blur-3xl"
                  style={{ background: `linear-gradient(135deg, ${indigo}40, ${accent}28)` }}
                  aria-hidden
                />
                <div
                  className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_28px_64px_-20px_rgba(11,28,44,0.22)] backdrop-blur-sm sm:p-8"
                >
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <LayoutDashboard className="h-4 w-4 transition-transform duration-500 group-hover:scale-110" style={{ color: indigo }} />
                      Live overview
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      Healthy cashflow
                    </span>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Outstanding</p>
                      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl" style={{ color: navy }}>
                        R 24 180
                      </p>
                      <p className="mt-1 text-sm text-slate-400">This month · ZAR</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <TrendingUp className="h-4 w-4" />
                      +12%
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Sent', value: '12', tone: 'bg-sky-50 text-sky-800 border-sky-100' },
                      { label: 'Paid', value: '7', tone: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
                      { label: 'Due', value: '3', tone: 'bg-amber-50 text-amber-900 border-amber-100' },
                    ].map((row) => (
                      <div key={row.label} className={cn('rounded-2xl border p-3 shadow-sm', row.tone)}>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{row.label}</div>
                        <div className="mt-1 text-xl font-bold tabular-nums">{row.value}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-snug text-slate-500"
                    style={{ borderColor: `${indigo}33`, background: `${indigo}08` }}
                  >
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0" style={{ color: indigo }} />
                    <span>Clients pay from a secure link—no banking details lost in email threads.</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Social proof */}
          <section
            className="border-y border-slate-200/70 py-16 sm:py-20"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(248,250,252,0.5) 50%, rgba(255,255,255,0.65) 100%)',
            }}
          >
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Trusted by growing businesses
            </p>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {['Cape Creative', 'Ubuntu Labs', 'Savannah Tech', 'Atlas Studio', 'Karoo Digital'].map((name) => (
                <motion.div
                  key={name}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="cursor-default text-sm font-semibold tracking-tight text-slate-400 opacity-75 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                >
                  {name}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="py-28 sm:py-36">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0B1C2C] sm:text-4xl sm:leading-[1.12] sm:tracking-[-0.035em] lg:text-[2.75rem]">
                Less admin. More momentum.
              </h2>
              <p className="mt-5 text-lg font-normal leading-relaxed text-slate-500 sm:text-xl">
                Everything you expect from serious invoicing software—without the clutter or the learning curve.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: FileText,
                  title: 'Smart Invoicing',
                  body: 'Polished invoices in minutes—VAT-aware line items and templates that match how you work.',
                },
                {
                  icon: Wallet,
                  title: 'Payment Tracking',
                  body: 'See what is sent, paid, or overdue so you always know who owes you and what to chase.',
                },
                {
                  icon: BellRing,
                  title: 'Automated Reminders',
                  body: 'Gentle nudges that protect relationships while keeping cashflow predictable.',
                },
                {
                  icon: BarChart3,
                  title: 'Financial Insights',
                  body: 'Spot trends early—revenue signals that help you plan hires, tax, and growth with confidence.',
                },
              ].map((f) => (
                <motion.div
                  key={f.title}
                  initial="rest"
                  whileHover="hover"
                  variants={{
                    rest: { y: 0 },
                    hover: {
                      y: -8,
                      transition: { type: 'spring', stiffness: 280, damping: 24, mass: 0.6 },
                    },
                  }}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(11,28,44,0.05)] transition-shadow duration-500 hover:border-slate-200 hover:shadow-[0_20px_50px_-18px_rgba(11,28,44,0.14)]"
                >
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100/90 shadow-sm"
                    style={{ background: `${indigo}0d`, color: indigo }}
                    whileHover={{ scale: 1.06, rotate: -3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  >
                    <f.icon className="h-6 w-6" />
                  </motion.div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-[#0B1C2C]">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section
            className="rounded-2xl border border-slate-200/70 px-6 py-16 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_24px_56px_-28px_rgba(11,28,44,0.12)] sm:px-12 sm:py-20"
            style={{
              background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 45%, rgba(255,255,255,0.92) 100%)',
            }}
          >
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#0B1C2C] sm:text-3xl lg:text-[2.125rem]">
                From invoice to income—three steps
              </h2>
              <p className="mt-4 text-base font-normal text-slate-500 sm:text-lg">A calm workflow your whole team can follow.</p>
            </div>
            <div className="relative mx-auto mt-16 grid max-w-5xl gap-12 md:grid-cols-3 md:gap-8">
              <div className="pointer-events-none absolute left-[14%] right-[14%] top-[2.35rem] hidden h-[2px] md:block">
                <div
                  className="h-full w-full rounded-full opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${indigo}22 15%, ${accent}33 50%, ${indigo}22 85%, transparent 100%)`,
                  }}
                />
              </div>
              {[
                {
                  step: '01',
                  title: 'Create Invoice',
                  desc: 'Add clients, line items, and branding—VAT calculated for you.',
                  icon: FileText,
                },
                {
                  step: '02',
                  title: 'Send to Client',
                  desc: 'Share a secure link or PDF—professional on every device.',
                  icon: Send,
                },
                {
                  step: '03',
                  title: 'Get Paid',
                  desc: 'Track status and reconcile payments without spreadsheet gymnastics.',
                  icon: Wallet,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  className="relative text-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: heroEase }}
                >
                  <motion.div
                    className="relative z-[1] mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white shadow-[0_8px_24px_-8px_rgba(11,28,44,0.15)]"
                    style={{
                      backgroundColor: i === 1 ? `${accent}22` : `${indigo}14`,
                      color: i === 1 ? accent : indigo,
                    }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                  >
                    <s.icon className="h-6 w-6" />
                  </motion.div>
                  <div className="mt-5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.step}</div>
                  <div className="mt-2 text-lg font-semibold text-[#0B1C2C]">{s.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Product showcase */}
          <section id="product-showcase" className="scroll-mt-28 py-28 sm:py-36">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55, ease: heroEase }}
              >
                <h2 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0B1C2C] sm:text-4xl sm:leading-[1.12] lg:text-[2.65rem]">
                  Everything you need to manage invoices in one place.
                </h2>
                <p className="mt-6 text-lg font-normal leading-relaxed text-slate-500 sm:text-xl">
                  One dashboard for drafting, sending, and tracking—so you spend less time chasing and more time on the work
                  that actually grows your business.
                </p>
                <ul className="mt-10 space-y-4 text-sm font-medium text-slate-600 sm:text-[15px]">
                  {[
                    'Outstanding balances at a glance',
                    'Consistent, branded documents every time',
                    'Built with South African payment and tax realities in mind',
                  ].map((line) => (
                    <li key={line} className="group flex gap-3">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white shadow-[0_2px_8px_-2px_rgba(0,196,140,0.6)] transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: accent }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: heroEase }}
                whileHover={{ y: -6 }}
                className="relative"
              >
                <div
                  className="absolute -inset-3 rounded-[1.65rem] opacity-40 blur-3xl"
                  style={{ background: `linear-gradient(145deg, ${indigo}, ${accent})` }}
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_32px_72px_-28px_rgba(11,28,44,0.28)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </div>
                    <span className="text-xs font-medium text-slate-400">Invoices · TimelyInvoices</span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This week</p>
                        <p className="mt-2 text-2xl font-bold" style={{ color: navy }}>
                          R 18 420 collected
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        6 invoices
                      </span>
                    </div>
                    <div className="mt-8 space-y-3">
                      {[
                        { client: 'Ubuntu Labs', amt: 'R 4 200', st: 'Paid', stc: 'text-emerald-700 bg-emerald-50' },
                        { client: 'Atlas Studio', amt: 'R 6 980', st: 'Sent', stc: 'text-sky-700 bg-sky-50' },
                        { client: 'Karoo Digital', amt: 'R 7 240', st: 'Due', stc: 'text-amber-800 bg-amber-50' },
                      ].map((row) => (
                        <div
                          key={row.client}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                        >
                          <span className="text-sm font-semibold text-slate-800">{row.client}</span>
                          <span className="text-sm font-bold tabular-nums text-slate-900">{row.amt}</span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', row.stc)}>{row.st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="pb-28 sm:pb-36">
            <h2 className="text-center text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#0B1C2C] sm:text-3xl lg:text-[2.125rem]">
              Teams that invoice with confidence
            </h2>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  quote:
                    'We finally moved off spreadsheets. Clients pay from the link and our status stays accurate—huge for cashflow.',
                  name: 'Nomsa K.',
                  biz: 'Studio owner · Johannesburg',
                },
                {
                  quote: 'Clean PDFs and VAT lines mean fewer finance questions. It saves hours every month.',
                  name: 'David L.',
                  biz: 'Consulting · Cape Town',
                },
                {
                  quote: 'The experience feels premium—our brand looks consistent from quote to payment.',
                  name: 'Priya N.',
                  biz: 'Creative agency',
                },
              ].map((t) => (
                <motion.div
                  key={t.name}
                  initial="rest"
                  whileHover="hover"
                  variants={{
                    rest: { y: 0 },
                    hover: { y: -6, transition: { type: 'spring', stiffness: 300, damping: 22 } },
                  }}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_28px_rgba(11,28,44,0.06)] transition-shadow duration-500 hover:border-slate-200 hover:shadow-[0_20px_48px_-20px_rgba(11,28,44,0.12)]"
                >
                  <p className="flex-1 text-[15px] font-normal leading-relaxed text-slate-500">“{t.quote}”</p>
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <div className="text-sm font-semibold text-[#0B1C2C]">{t.name}</div>
                    <div className="text-xs font-medium text-slate-400">{t.biz}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="scroll-mt-28 pb-32 sm:pb-40">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-[#0B1C2C] sm:text-4xl lg:text-[2.65rem]">
                Plans that scale with you
              </h2>
              <p className="mt-5 text-lg font-normal text-slate-500 sm:text-xl">
                Start free. Upgrade when you need depth, automation, and polish.
              </p>
            </div>
            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              {[
                {
                  name: 'Starter',
                  price: 'R59',
                  sub: 'per month',
                  feats: ['Unlimited invoices', 'Core branding', 'Email delivery', 'Payment links'],
                  cta: 'Get Starter',
                  highlight: false,
                },
                {
                  name: 'Pro',
                  price: 'R129',
                  sub: 'per month',
                  feats: ['Everything in Starter', 'Automated reminders', 'Advanced reporting', 'Priority support'],
                  cta: 'Go Pro',
                  highlight: true,
                },
                {
                  name: 'Business',
                  price: 'R249',
                  sub: 'per month',
                  feats: ['Everything in Pro', 'Team seats', 'API & integrations', 'Dedicated onboarding'],
                  cta: 'Talk to us',
                  highlight: false,
                },
              ].map((p) => (
                <motion.div
                  key={p.name}
                  initial="rest"
                  whileHover="hover"
                  variants={{
                    rest: { y: 0 },
                    hover: {
                      y: p.highlight ? -4 : -6,
                      transition: { type: 'spring', stiffness: 260, damping: 22 },
                    },
                  }}
                  className={cn(
                    'relative flex flex-col rounded-2xl border bg-white p-8 transition-shadow duration-500',
                    p.highlight
                      ? 'z-10 border-2 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_28px_60px_-20px_rgba(0,196,140,0.35)] lg:-mt-2 lg:mb-2'
                      : 'border-slate-200/80 shadow-[0_4px_28px_rgba(11,28,44,0.06)] hover:shadow-[0_20px_50px_-24px_rgba(11,28,44,0.12)]'
                  )}
                  style={p.highlight ? { borderColor: accent } : undefined}
                >
                  {p.highlight ? (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_16px_-4px_rgba(0,196,140,0.7)]"
                      style={{ backgroundColor: accent }}
                    >
                      Most Popular
                    </span>
                  ) : null}
                  <div className={cn('text-xs font-bold uppercase tracking-wider', p.highlight ? 'text-[#0B1C2C]' : 'text-slate-400')}>
                    {p.name}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-[#0B1C2C]">{p.price}</span>
                    <span className="text-sm font-medium text-slate-400">{p.sub}</span>
                  </div>
                  <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-500">
                    {p.feats.map((f) => (
                      <li key={f} className="flex gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={routes.auth.register} className={cn('group block', p.highlight && 'relative')}>
                      {p.highlight ? (
                        <Button
                          className={cn('h-12 w-full rounded-2xl font-semibold text-white', primaryBtnClass)}
                          style={{ background: `linear-gradient(145deg, ${accent} 0%, #00b37a 48%, #009e6e 100%)` }}
                        >
                          {p.cta}{' '}
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className={cn('h-12 w-full rounded-2xl font-semibold', secondaryBtnClass, 'border-slate-200 bg-slate-50/90')}
                        >
                          {p.cta}{' '}
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Button>
                      )}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-28 pb-28 sm:pb-36">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#0B1C2C] sm:text-3xl lg:text-[2.125rem]">
                Questions, answered
              </h2>
              <p className="mt-4 text-base font-normal text-slate-500 sm:text-lg">Straight answers—no jargon, no surprises.</p>
            </div>
            <div className="mx-auto mt-12 max-w-2xl space-y-3">
              {[
                {
                  q: 'Is it free?',
                  a: 'Yes—you can start on a generous free tier to send professional invoices and experience the product. Paid plans unlock higher volume, automation, and team features when you are ready.',
                },
                {
                  q: 'How do payments work?',
                  a: 'You share a secure payment link with clients. They pay online; TimelyInvoices helps you track status so reconciliation stays simple—without manual follow-ups for every invoice.',
                },
                {
                  q: 'Can I track clients?',
                  a: 'Yes. Keep client records, invoice history, and payment status in one place so conversations stay informed and professional.',
                },
                {
                  q: 'Is it secure?',
                  a: 'We follow modern security practices for authentication and data handling. Always use a strong password and keep your workspace access limited to people who need it.',
                },
                {
                  q: 'Does it work for VAT?',
                  a: 'Line items and documents are built with VAT-friendly structure in mind so your invoices stay clear—for you and for your clients.',
                },
              ].map((item, i) => {
                const open = faqOpen === i;
                return (
                  <motion.div
                    key={item.q}
                    layout
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_2px_16px_rgba(11,28,44,0.04)] backdrop-blur-[2px] transition-colors hover:border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-[1.125rem] text-left transition-colors hover:bg-slate-50/90"
                    >
                      <span className="text-sm font-semibold text-[#0B1C2C]">{item.q}</span>
                      <motion.span
                        initial={false}
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                        className="inline-flex shrink-0 text-slate-400"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </motion.span>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                      transition={{ duration: 0.32, ease: heroEase }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm font-normal leading-relaxed text-slate-500">{item.a}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Final CTA */}
          <section className="pb-32 sm:pb-40">
            <motion.div
              className="relative overflow-hidden rounded-2xl px-8 py-16 text-center sm:px-14 sm:py-20"
              style={{
                background: `linear-gradient(155deg, ${navy} 0%, #0d2438 45%, #071018 100%)`,
                boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 80px -32px rgba(0,0,0,0.45)',
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: heroEase }}
            >
              <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full opacity-35 blur-3xl" style={{ background: indigo }} />
              <div className="pointer-events-none absolute -right-20 bottom-[-10%] h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ background: accent }} />
              <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-3xl lg:text-[2.25rem]">
                  Start getting paid faster today
                </h2>
                <p className="mt-5 text-base font-normal leading-relaxed text-slate-400 sm:text-lg">
                  Join South African businesses that invoice with clarity—and collect with confidence.
                </p>
                <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
                  <Link href={routes.auth.register} className="group">
                    <Button
                      size="lg"
                      className={cn(
                        'h-[3.25rem] w-full rounded-2xl px-10 font-semibold text-[#0B1C2C] sm:w-auto',
                        primaryBtnClass
                      )}
                      style={{
                        background: `linear-gradient(180deg, #00e6a8 0%, ${accent} 40%, #00a876 100%)`,
                        boxShadow:
                          '0 1px 0 rgba(255,255,255,0.35) inset, 0 12px 40px -8px rgba(0, 196, 140, 0.55), 0 0 0 1px rgba(0,196,140,0.2)',
                      }}
                    >
                      Create Free Account{' '}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="group">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="h-[3.25rem] w-full rounded-2xl border border-white/12 bg-white/[0.07] px-8 font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/12 sm:w-auto"
                    >
                      <MessageCircle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                      Chat on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="border-t border-slate-200/70 py-16 sm:py-20">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_8px_20px_-8px_rgba(11,28,44,0.4)] transition-transform duration-300 hover:scale-105"
                  style={{ background: `linear-gradient(145deg, ${navy}, #132f47)` }}
                >
                  <Layers className="h-4 w-4" />
                </span>
                <span className="font-semibold text-[#0B1C2C]">TimelyInvoices</span>
              </div>
              <p className="mt-4 max-w-xs text-sm font-normal leading-relaxed text-slate-500">
                Smart invoicing for South African businesses—professional, fast, and built for how you actually work.
              </p>
              <p className="mt-10 text-xs text-slate-400">© {new Date().getFullYear()} TimelyInvoices</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Product</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>
                  <button type="button" onClick={() => scrollToId('product-showcase')} className="transition hover:text-[#0B1C2C]">
                    Overview
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToId('pricing')} className="transition hover:text-[#0B1C2C]">
                    Pricing
                  </button>
                </li>
                <li>
                  <Link href={routes.auth.register} className="transition hover:text-[#0B1C2C]">
                    Sign up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>
                  <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="transition hover:text-[#0B1C2C]">
                    Contact
                  </a>
                </li>
                <li>
                  <Link href={routes.auth.login} className="transition hover:text-[#0B1C2C]">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>
                  <span className="cursor-default text-slate-400">Privacy Policy (coming soon)</span>
                </li>
                <li>
                  <span className="cursor-default text-slate-400">Terms of Service (coming soon)</span>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
