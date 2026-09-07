'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { timelyImages } from '@/components/landing/timelyAssets';
import { cn } from '@/lib/utils/cn';

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const [showUi, setShowUi] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShowUi(true);
      return;
    }
    const t = window.setTimeout(() => setShowUi(true), 450);
    return () => window.clearTimeout(t);
  }, [inView, reduce]);

  return (
    <section className="tl-section border-y border-[var(--tl-line)] bg-[var(--tl-surface)]">
      <div className="tl-container">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-20">
          <div className="max-w-lg lg:py-4">
            <h2 className="tl-h2 tl-h2-wide">
              You started a business.
              <br />
              Not a debt-collection agency.
            </h2>
            <p className="tl-body mt-6 max-w-md">
              Your time shouldn&apos;t disappear into invoices, follow-ups and spreadsheets.
            </p>
          </div>

          <div ref={ref} className="relative">
            <div className="tl-lifestyle-frame relative aspect-[5/4] w-full overflow-hidden sm:aspect-[4/3]">
              <Image
                src={timelyImages.lifestyle.businessOwner}
                alt="Business owner working through admin at a laptop"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 52vw"
                priority={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--tl-ink)]/25 via-transparent to-transparent"
                aria-hidden
              />
            </div>

            {/* Purposeful product cue — overdue invoice on the admin moment */}
            <div
              className={cn(
                'absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-auto sm:w-60 transition-opacity duration-500',
                showUi ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white/96 px-4 py-3.5 shadow-[var(--tl-shadow)] backdrop-blur-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--tl-danger)]">Invoice overdue</p>
                    <p className="mt-0.5 text-[12px] text-[var(--tl-ink-2)]">Cape Creative</p>
                  </div>
                  <p className="tl-num text-base font-semibold text-[var(--tl-ink)]">
                    {formatZarDisplay(12400)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
