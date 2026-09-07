'use client';

import { useEffect, useState } from 'react';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { cn } from '@/lib/utils/cn';

const STEPS = [
  { label: 'Created', detail: 'INV-1042 drafted', done: false },
  { label: 'Sent', detail: 'Delivered to client', done: false },
  { label: 'Viewed', detail: 'Opened on mobile', done: false },
  { label: 'Due', detail: 'Payment due Friday', done: false },
  { label: 'Paid', detail: formatZarDisplay(8500), done: true },
] as const;

export function CollectionsSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setStep(STEPS.length - 1);
      return;
    }
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="payments" className="tl-section">
      <div className="tl-container">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
          <div className="max-w-md">
            <h2 className="tl-h2">Stop chasing payments.</h2>
            <p className="mt-5 text-xl font-semibold leading-snug tracking-tight text-[var(--tl-ink)]">
              Know what&apos;s paid. Know what&apos;s late.
            </p>
            <p className="tl-body mt-6">
              Timely tracks every invoice so you don&apos;t have to remember who owes you what.
            </p>
          </div>

          <div className="rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-[var(--tl-surface)] p-8 shadow-[var(--tl-shadow)] sm:p-10">
            <p className="tl-label">Invoice lifecycle</p>
            <ol className="mt-8">
              {STEPS.map((s, i) => {
                const active = i <= step;
                const current = i === step;
                return (
                  <li key={s.label} className="relative flex gap-5 pb-7 last:pb-0">
                    {i < STEPS.length - 1 ? (
                      <span
                        className={cn(
                          'absolute left-3.5 top-8 h-[calc(100%-1.25rem)] w-px',
                          i < step ? 'bg-[var(--tl-accent)]' : 'bg-[var(--tl-line)]'
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        'relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold',
                        s.done && active
                          ? 'border-[var(--tl-success)] bg-[var(--tl-success)] text-white'
                          : current
                            ? 'border-[var(--tl-accent)] bg-[var(--tl-accent)] text-white'
                            : active
                              ? 'border-[var(--tl-accent)] bg-[var(--tl-accent-soft)] text-[var(--tl-accent)]'
                              : 'border-[var(--tl-line)] bg-[var(--tl-bg)] text-[var(--tl-ink-3)]'
                      )}
                    >
                      {s.done && active ? '✓' : i + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={cn(
                          'text-[15px] font-semibold',
                          active ? 'text-[var(--tl-ink)]' : 'text-[var(--tl-ink-3)]'
                        )}
                      >
                        {s.label}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-[13px]',
                          s.done && current
                            ? 'tl-num font-semibold text-[var(--tl-success)]'
                            : 'text-[var(--tl-ink-3)]'
                        )}
                      >
                        {s.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
