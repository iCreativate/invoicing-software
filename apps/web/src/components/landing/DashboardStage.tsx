import { Reveal } from '@/components/landing/landingMotion';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { ProductChrome, ProductSidebar } from '@/components/landing/ProductChrome';
import { cn } from '@/lib/utils/cn';

const BARS = [38, 52, 44, 61, 48, 70, 55, 64, 72, 58, 81, 66];

const ATTENTION = [
  { label: '2 overdue invoices', value: 8920, danger: true },
  { label: '3 due this week', value: 14200 },
  { label: '1 quote awaiting acceptance', value: 18500 },
];

/** Marketing dashboard mock — used where a full stage is needed outside the hero. */
export function DashboardStage({ className }: { className?: string }) {
  return (
    <Reveal>
      <ProductChrome
        className={className}
        title="Dashboard · Timely"
        trailing={<span className="text-[11px] text-[var(--tl-ink-3)]">Today</span>}
      >
        <div className="grid lg:grid-cols-[7.5rem_minmax(0,1fr)]">
          <ProductSidebar active="Dashboard" />
          <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-[13px] text-[var(--tl-ink-3)]">Good morning</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--tl-ink)]">
                Here&apos;s how your business is doing today.
              </p>

              <p className="tl-label mt-8">Outstanding</p>
              <p className="tl-num mt-2 text-[clamp(2.25rem,5.5vw,3.5rem)] font-semibold leading-none">
                {formatZarDisplay(24180)}
              </p>
              <p className="mt-2 text-sm text-[var(--tl-ink-2)]">4 invoices still open</p>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--tl-line)] pt-5">
                <div>
                  <p className="text-[11px] text-[var(--tl-ink-3)]">Paid</p>
                  <p className="tl-num mt-1 text-lg font-semibold sm:text-xl">{formatZarDisplay(71540)}</p>
                  <p className="mt-1 text-[11px] text-[var(--tl-success)]">↑ 18.4%</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--tl-ink-3)]">Overdue</p>
                  <p className="tl-num mt-1 text-lg font-semibold text-[var(--tl-danger)] sm:text-xl">
                    {formatZarDisplay(8920)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--tl-ink-3)]">Expected</p>
                  <p className="tl-num mt-1 text-lg font-semibold sm:text-xl">{formatZarDisplay(18400)}</p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[11px] text-[var(--tl-ink-3)]">Revenue · 30 days</p>
                <div className="mt-3 flex h-24 items-end gap-1.5" aria-hidden>
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className="tl-bar flex-1 rounded-sm bg-gradient-to-t from-[var(--tl-accent)] to-[var(--tl-indigo)]/80"
                      style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className={cn('space-y-4 border-t border-[var(--tl-line)] pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0')}>
              <p className="text-xs font-semibold text-[var(--tl-ink)]">Needs attention</p>
              {ATTENTION.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-[var(--tl-ink-2)]">{row.label}</span>
                  <span className={cn('tl-num font-medium', row.danger && 'text-[var(--tl-danger)]')}>
                    {formatZarDisplay(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProductChrome>
    </Reveal>
  );
}
