'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

export function InsightsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setStep(4);
      return;
    }
    const delays = [0, 280, 560, 900, 1200];
    const timers = delays.map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [inView]);

  return (
    <section className="tl-section tl-ai-section">
      <div className="tl-container">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="tl-h2">Timely notices what you miss.</h2>
            <p className="mt-6 max-w-sm text-[17px] leading-relaxed text-slate-300">
              You shouldn&apos;t have to constantly check to know what needs attention.
            </p>
          </div>

          <div className="lg:col-span-7" ref={ref}>
            <div className="overflow-hidden rounded-[var(--tl-radius)] border border-white/10 bg-[#121820] shadow-[var(--tl-shadow-float)]">
              <div className="px-7 py-8 sm:px-9 sm:py-9">
                <div
                  className={cn(
                    'transition-opacity duration-500',
                    step >= 1 ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <p className="text-[12px] font-semibold text-violet-300">✦ Timely noticed something</p>
                </div>
                <div
                  className={cn(
                    'mt-5 transition-opacity duration-500',
                    step >= 2 ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Good morning.
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                    3 invoices are overdue.
                  </p>
                </div>
                <div
                  className={cn(
                    'mt-4 transition-opacity duration-500',
                    step >= 3 ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <p className="tl-num text-lg font-semibold text-slate-100">
                    {formatZarDisplay(18400)}{' '}
                    <span className="text-[13px] font-medium text-slate-400">outstanding</span>
                  </p>
                  <p className="mt-1.5 text-[13px] text-slate-400">2 payments due this week</p>
                </div>
              </div>

              <div
                className={cn(
                  'flex flex-wrap gap-3 border-t border-white/10 px-7 py-6 sm:px-9 transition-opacity duration-500',
                  step >= 4 ? 'opacity-100' : 'opacity-0'
                )}
              >
                <Link
                  href={routes.auth.register}
                  className="inline-flex h-11 items-center rounded-full bg-[var(--tl-violet)] px-5 text-sm font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  Review invoices →
                </Link>
                <Link
                  href={routes.auth.register}
                  className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-medium text-slate-100 transition-colors hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
                >
                  Remind client →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
