'use client';

import { cn } from '@/lib/utils/cn';
import { formatZarDisplay } from '@/components/landing/formatZar';

const BARS = [42, 58, 35, 72, 64, 88, 51, 69, 77, 55, 91, 68];

export function ProductStage({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-[var(--tl-surface)] shadow-[0_1px_0_rgba(16,20,24,0.04),0_24px_48px_rgba(16,20,24,0.06)]',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--tl-line)] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[var(--tl-line-strong)]" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-[var(--tl-line-strong)]" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-[var(--tl-line-strong)]" aria-hidden />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-[var(--tl-ink-3)]">Overview · TimelyInvoices</span>
      </div>

      <div className={cn('grid gap-8 p-5 sm:p-7', compact ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.2fr_0.8fr]')}>
        <div>
          <p className="tl-label">Collected this month</p>
          <p className="tl-num mt-2 text-[clamp(2.5rem,6vw,3.75rem)] font-semibold leading-none text-[var(--tl-ink)]">
            {formatZarDisplay(71540)}
          </p>
          <p className="mt-2 text-sm text-[var(--tl-ink-2)]">
            <span className="text-[var(--tl-success)]">+12.4%</span> vs last month
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--tl-line)] pt-5">
            {[
              { label: 'Outstanding', value: 24180 },
              { label: 'Overdue', value: 8920 },
              { label: 'Expected', value: 18400 },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[11px] text-[var(--tl-ink-3)]">{m.label}</p>
                <p className="tl-num mt-1 text-lg font-semibold sm:text-xl">{formatZarDisplay(m.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(compact && 'border-t border-[var(--tl-line)] pt-6')}>
          <p className="tl-label">Cash collected · 30 days</p>
          <div className="mt-4 flex h-28 items-end gap-1.5 sm:h-32 sm:gap-2" aria-hidden>
            {BARS.map((h, i) => (
              <div
                key={i}
                className="tl-bar flex-1 rounded-sm bg-[var(--tl-accent)]/85"
                style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-[var(--tl-line)] pt-4">
            <p className="text-xs font-semibold text-[var(--tl-ink)]">Needs attention</p>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[var(--tl-ink-2)]">2 overdue invoices</span>
              <span className="tl-num font-medium">{formatZarDisplay(8920)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[var(--tl-ink-2)]">3 due this week</span>
              <span className="tl-num font-medium">{formatZarDisplay(14200)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
