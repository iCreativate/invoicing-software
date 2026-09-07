'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { cn } from '@/lib/utils/cn';

const BARS = [38, 52, 44, 61, 48, 70, 55, 64, 72, 58, 81, 66];

const METRICS = [
  { label: 'Collection rate', value: '94%' },
  { label: 'Avg. days to pay', value: '11d' },
  { label: 'Active clients', value: '48' },
];

export function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduce = useReducedMotion();

  return (
    <section id="product" className="tl-section tl-dark-section">
      <div className="tl-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="tl-label">Your business. At a glance.</p>
          <h2 className="tl-h2 mx-auto mt-5">
            Everything you need.
            <br />
            Nothing you don&apos;t.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-slate-300">
            Cash, collections and what needs attention — without drowning in reports.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            'mt-14 transition-opacity duration-700',
            inView || reduce ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className="overflow-hidden rounded-[var(--tl-radius)] border border-white/10 bg-[#121820] shadow-[var(--tl-shadow-float)]"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" aria-hidden />
              <span className="ml-2 text-[12px] text-slate-400">Dashboard · Timely</span>
            </div>

            <div className="grid lg:grid-cols-[8rem_minmax(0,1fr)]">
              <aside className="hidden border-r border-white/10 bg-[#0c1016] px-4 py-6 lg:block" aria-hidden>
                <p className="px-2 text-[10px] font-semibold tracking-[0.14em] text-white">TIMELY</p>
                <nav className="mt-6 space-y-1 text-[12px]">
                  {['Dashboard', 'Money', 'Clients', 'Insights'].map((item, i) => (
                    <div
                      key={item}
                      className={cn(
                        'rounded-[var(--tl-radius-sm)] px-2.5 py-2',
                        i === 0 ? 'bg-white/10 text-white' : 'text-slate-500'
                      )}
                    >
                      {item}
                    </div>
                  ))}
                </nav>
              </aside>

              <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.3fr_0.7fr] xl:p-10">
                <div>
                  <p className="text-[13px] text-slate-400">Good morning</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-white">
                    Here&apos;s how your business is doing today.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Outstanding', value: 24180 },
                      { label: 'Overdue', value: 8920, danger: true },
                      { label: 'Paid', value: 71540, ok: true },
                      { label: 'Expected', value: 18400 },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-[var(--tl-radius-sm)] bg-white/[0.04] px-3.5 py-3.5"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">{m.label}</p>
                        <p
                          className={cn(
                            'tl-num mt-2 text-base font-semibold text-white sm:text-lg',
                            m.danger && 'text-red-400',
                            m.ok && 'text-emerald-400'
                          )}
                        >
                          {formatZarDisplay(m.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-[var(--tl-radius-sm)] bg-white/[0.04] p-5">
                    <p className="text-[11px] text-slate-400">Revenue · 30 days</p>
                    <div className="mt-4 flex h-28 items-end gap-1.5" aria-hidden>
                      {BARS.map((h, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-sm bg-blue-500/85',
                            inView && !reduce && 'tl-bar'
                          )}
                          style={{ height: `${h}%`, animationDelay: `${i * 35}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8 border-t border-white/10 pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
                  <div>
                    <p className="text-[12px] font-semibold text-white">Recent activity</p>
                    <ul className="mt-4 space-y-3.5 text-[13px] text-slate-300">
                      <li>Payment received · Cape Creative · {formatZarDisplay(8500)}</li>
                      <li>Invoice viewed · Harbour Studio</li>
                      <li>Reminder sent · Naledi Labs</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">Invoices</p>
                    <ul className="mt-4 space-y-3.5 text-[13px]">
                      {[
                        ['INV-1042', 'Paid', 'text-emerald-400'],
                        ['INV-1041', 'Due', 'text-amber-300'],
                        ['INV-1038', 'Overdue', 'text-red-400'],
                      ].map(([n, s, c]) => (
                        <li key={n} className="flex justify-between gap-2 text-slate-300">
                          <span>{n}</span>
                          <span className={c}>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="rounded-[var(--tl-radius)] bg-white/[0.035] px-4 py-5 text-center sm:py-6"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-400">{m.label}</p>
              <p className="tl-num mt-3 text-xl font-semibold text-white sm:text-2xl">{m.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
