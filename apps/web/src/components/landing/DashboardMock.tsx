'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { MetricPill, ProductMockupCard } from '@/components/landing/premium';

function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'info'; children: string }) {
  return (
    <MetricPill tone={tone === 'ok' ? 'success' : tone === 'warn' ? 'warning' : 'info'}>
      {children}
    </MetricPill>
  );
}

export function DashboardMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <ProductMockupCard>
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4" style={{ borderColor: 'var(--ti-border)' }}>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ti-text-2)' }}>
              Cashflow overview
            </div>
            <div className="mt-1 truncate text-sm font-semibold">April 2026 · ZAR</div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="ok">Payments healthy</Pill>
            <span className="hidden text-xs sm:inline" style={{ color: 'var(--ti-text-2)' }}>
              Updated now
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface-muted)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ti-text-2)' }}>
              Outstanding
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">R 24 180</div>
            <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--ti-text-2)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ti-accent)' }} />
              Payment links active
            </div>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ti-text-2)' }}>
              Paid
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">R 71 540</div>
            <div className="mt-2 text-xs" style={{ color: 'var(--ti-text-2)' }}>
              7 invoices settled this month
            </div>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)' }}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ti-text-2)' }}>
                Overdue
              </div>
              <Pill tone="warn">3 need follow-up</Pill>
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">R 8 920</div>
            <div className="mt-2 text-xs" style={{ color: 'var(--ti-text-2)' }}>
              Auto reminders queued
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-2xl border" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)' }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--ti-border)' }}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ti-text-2)' }}>
                Latest invoices
              </div>
              <Pill tone="info">Links tracked</Pill>
            </div>
            <div className="grid gap-0">
              {[
                { n: 'INV-2026-10418', c: 'Karoo Digital', s: 'Sent', tone: 'info' as const, amt: 'R 5 800' },
                { n: 'INV-2026-10407', c: 'Ubuntu Labs', s: 'Paid', tone: 'ok' as const, amt: 'R 12 400' },
                { n: 'INV-2026-10391', c: 'Cape Creative', s: 'Overdue', tone: 'warn' as const, amt: 'R 3 120' },
              ].map((r, idx) => (
                <div
                  key={r.n}
                  className={cn('grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm', idx !== 2 && 'border-b')}
                  style={{ borderColor: 'var(--ti-border)' }}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.n}</div>
                    <div className="truncate text-xs" style={{ color: 'var(--ti-text-2)' }}>
                      {r.c}
                    </div>
                  </div>
                  <div className="text-right text-xs sm:text-left" style={{ color: 'var(--ti-text-2)' }}>
                    {r.amt}
                  </div>
                  <div className="flex justify-end">
                    <Pill tone={r.tone}>{r.s}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs" style={{ color: 'var(--ti-text-2)' }}>
              Payment status updates automatically when clients pay via secure link.
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ti-accent)' }} />
              Reconciled
            </div>
          </div>
        </div>
      </ProductMockupCard>
    </motion.div>
  );
}

