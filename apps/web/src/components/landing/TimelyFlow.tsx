'use client';

import { useState } from 'react';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { cn } from '@/lib/utils/cn';

const STAGES = [
  {
    id: '01',
    title: 'Create',
    body: 'Professional quotes in seconds.',
    visual: (
      <div className="rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Quote</p>
        <p className="mt-2 text-[13px] font-semibold text-[var(--tl-ink)]">Brand refresh</p>
        <p className="tl-num mt-3 text-lg font-semibold text-[var(--tl-accent)]">{formatZarDisplay(18500)}</p>
      </div>
    ),
  },
  {
    id: '02',
    title: 'Send',
    body: 'Delivered straight to your client.',
    visual: (
      <div className="rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] p-4">
        <p className="text-[10px] font-semibold text-[var(--tl-accent)]">Sent · just now</p>
        <div className="mt-4 flex items-center gap-2 rounded-[var(--tl-radius-sm)] bg-[var(--tl-accent-soft)] px-3 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--tl-accent)]" />
          <span className="text-[11px] font-medium text-[var(--tl-ink)]">Delivered</span>
        </div>
      </div>
    ),
  },
  {
    id: '03',
    title: 'Collect',
    body: 'Viewed, due and paid — tracked.',
    visual: (
      <div className="rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] p-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-[var(--tl-ink)]">INV-1042</span>
          <span className="font-semibold text-[var(--tl-warning)]">Due Fri</span>
        </div>
        <p className="tl-num mt-3 text-lg font-semibold">{formatZarDisplay(12400)}</p>
      </div>
    ),
  },
  {
    id: '04',
    title: 'Understand',
    body: 'See what your money is doing.',
    visual: (
      <div className="rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Next 14 days</p>
        <p className="tl-num mt-2 text-lg font-semibold text-[var(--tl-indigo)]">{formatZarDisplay(18400)}</p>
        <div className="mt-4 flex h-8 items-end gap-1" aria-hidden>
          {[40, 55, 48, 70, 62, 80].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-[var(--tl-indigo)]/75" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
] as const;

export function TimelyFlow() {
  const [active, setActive] = useState(0);

  return (
    <section id="story" className="tl-section">
      <div className="tl-container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="tl-h2 mx-auto">From quote to clarity.</h2>
          <p className="tl-body mx-auto mt-5 max-w-md">
            Four steps. One continuous path from proposal to cash in the bank.
          </p>
        </div>

        {/* Connecting progression line (desktop) */}
        <div className="relative mt-16">
          <div
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[1.15rem] hidden h-px bg-[var(--tl-line)] xl:block"
            aria-hidden
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {STAGES.map((stage, i) => {
              const on = active === i;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className={cn(
                    'tl-card-interactive group relative flex h-full flex-col rounded-[var(--tl-radius)] border p-6 text-left',
                    on
                      ? 'border-[var(--tl-accent)]/30 bg-white'
                      : 'border-[var(--tl-line)] bg-[var(--tl-bg)]/50'
                  )}
                >
                  <span
                    className={cn(
                      'relative z-10 grid h-9 w-9 place-items-center rounded-full border text-[12px] font-semibold',
                      on
                        ? 'border-[var(--tl-accent)] bg-[var(--tl-accent)] text-white'
                        : 'border-[var(--tl-line)] bg-[var(--tl-surface)] text-[var(--tl-ink-3)]'
                    )}
                  >
                    {stage.id}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--tl-ink)]">
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--tl-ink-2)]">{stage.body}</p>
                  <div className="mt-auto pt-6">{stage.visual}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
