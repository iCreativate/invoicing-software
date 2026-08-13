'use client';

import { Reveal } from '@/components/landing/landingMotion';
import { formatZarDisplay } from '@/components/landing/formatZar';

const SERIES = [
  { label: 'Wk 1', collected: 18, expected: 8 },
  { label: 'Wk 2', collected: 22, expected: 10 },
  { label: 'Wk 3', collected: 15, expected: 14 },
  { label: 'Wk 4', collected: 28, expected: 9 },
  { label: 'Wk 5', collected: 24, expected: 12 },
  { label: 'Wk 6', collected: 31, expected: 7 },
];

export function CashflowSection() {
  const max = Math.max(...SERIES.map((s) => s.collected + s.expected));

  return (
    <section className="border-y border-[var(--tl-line)] bg-[var(--tl-surface)]">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
        <Reveal>
          <p className="tl-label">Cashflow</p>
          <h2 className="tl-h2 mt-3">Know what&apos;s coming.</h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
          <Reveal delayMs={40}>
            <dl className="space-y-8">
              {[
                { label: 'Collected', value: 71540 },
                { label: 'Expected', value: 24180 },
                { label: 'Overdue', value: 8920 },
              ].map((row) => (
                <div key={row.label} className="border-t border-[var(--tl-line)] pt-5">
                  <dt className="text-sm text-[var(--tl-ink-3)]">{row.label}</dt>
                  <dd className="tl-num mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {formatZarDisplay(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delayMs={90}>
            <p className="tl-label mb-4">30-day outlook</p>
            <div className="flex h-48 items-end gap-3 sm:h-56 sm:gap-4" role="img" aria-label="Cashflow by week">
              {SERIES.map((s, i) => (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full flex-col justify-end gap-0.5 sm:h-48">
                    <div
                      className="tl-bar w-full rounded-sm bg-[var(--tl-accent)]/25"
                      style={{
                        height: `${(s.expected / max) * 100}%`,
                        animationDelay: `${i * 50 + 100}ms`,
                      }}
                      title="Expected"
                    />
                    <div
                      className="tl-bar w-full rounded-sm bg-[var(--tl-accent)]"
                      style={{
                        height: `${(s.collected / max) * 100}%`,
                        animationDelay: `${i * 50}ms`,
                      }}
                      title="Collected"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--tl-ink-3)]">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-6 text-xs text-[var(--tl-ink-3)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 bg-[var(--tl-accent)]" aria-hidden /> Collected
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 bg-[var(--tl-accent)]/25" aria-hidden /> Expected
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
