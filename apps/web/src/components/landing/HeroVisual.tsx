'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { ProductChrome, ProductSidebar } from '@/components/landing/ProductChrome';

const ease = [0.22, 1, 0.36, 1] as const;
const BARS = [42, 55, 48, 68, 58, 78, 64, 72, 88, 70, 92, 76];

/** Lean hero product frame — one dashboard, no floating add-ons. */
export function HeroVisual({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    const layer = pointerLayerRef.current;
    if (!root || !layer) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;
    let alive = true;
    let running = false;

    const tick = () => {
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      layer.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
      const settled =
        Math.abs(target.x - current.x) < 0.05 && Math.abs(target.y - current.y) < 0.05;
      if (!alive || settled) {
        running = false;
        if (settled) {
          current.x = target.x;
          current.y = target.y;
          layer.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !alive) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      const ny = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
      target.x = Math.max(-4, Math.min(4, nx * 4));
      target.y = Math.max(-3, Math.min(3, ny * 3));
      start();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [reduce]);

  return (
    <div ref={rootRef} className={cn('relative mx-auto w-full max-w-lg lg:max-w-none', className)}>
      <div ref={pointerLayerRef} className="relative will-change-transform" style={{ transform: 'translate3d(0,0,0)' }}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 0.36, ease }}
        >
          <div className="tl-hero-dash overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--tl-line)] px-4 py-3">
              <div className="flex shrink-0 gap-1.5" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              </div>
              <span className="ml-1 text-[11px] font-medium text-[var(--tl-ink-3)]">Dashboard · Timely</span>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-[12px] text-[var(--tl-ink-3)]">Good morning</p>
              <p className="mt-1 text-[15px] font-semibold tracking-tight text-[var(--tl-ink)]">
                Here&apos;s your business today
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Outstanding', value: 24180 },
                  { label: 'Paid', value: 71540, ok: true },
                  { label: 'Expected', value: 18400 },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] px-3 py-3"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">
                      {m.label}
                    </p>
                    <p
                      className={cn(
                        'tl-num mt-2 text-[13px] font-semibold sm:text-sm',
                        m.ok && 'text-[var(--tl-success)]'
                      )}
                    >
                      {formatZarDisplay(m.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[var(--tl-ink)]">Revenue</p>
                  <p className="tl-num text-[12px] font-semibold text-[var(--tl-accent)]">
                    {formatZarDisplay(71540)}
                  </p>
                </div>
                <div className="mt-4 flex h-20 items-end gap-1" aria-hidden>
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 rounded-t-sm bg-[var(--tl-accent)]/80',
                        !reduce && 'tl-bar'
                      )}
                      style={{
                        height: `${h}%`,
                        ...(reduce ? null : { animationDelay: `${i * 30}ms` }),
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--tl-radius-sm)] bg-[var(--tl-bg)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--tl-ink)]">Payment received</p>
                  <p className="mt-0.5 text-[11px] text-[var(--tl-ink-3)]">Cape Creative</p>
                </div>
                <p className="tl-num shrink-0 text-sm font-semibold text-[var(--tl-success)]">
                  {formatZarDisplay(8500)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function ProductStage({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <ProductChrome className={className} title="Dashboard · Timely">
      <div className={cn('grid', compact ? '' : 'lg:grid-cols-[7.5rem_minmax(0,1fr)]')}>
        {compact ? null : <ProductSidebar active="Dashboard" />}
        <div className={cn('grid gap-6 p-6', compact ? '' : 'xl:grid-cols-[1.15fr_0.85fr]')}>
          <div>
            <p className="tl-label">Collected this month</p>
            <p className="tl-num mt-2 text-3xl font-semibold leading-none">{formatZarDisplay(71540)}</p>
          </div>
        </div>
      </div>
    </ProductChrome>
  );
}
