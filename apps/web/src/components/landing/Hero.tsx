'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';
import { routes } from '@/lib/routing/routes';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { LandingPrimaryLink, LandingSecondaryLink } from '@/components/landing/ProductChrome';
import { timelyImages } from '@/components/landing/timelyAssets';

const ease = [0.22, 1, 0.36, 1] as const;

function enter(delay: number, reduce: boolean | null) {
  if (reduce) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease },
  };
}

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 32]);
  const productY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 16]);

  return (
    <section
      ref={sectionRef}
      className="tl-hero relative isolate flex min-h-[min(100dvh,52rem)] flex-col justify-end overflow-x-clip pb-16 pt-[6.5rem] sm:min-h-[min(100dvh,56rem)] sm:pb-20 sm:pt-28 lg:min-h-[min(100dvh,58rem)] lg:justify-center lg:pb-24 lg:pt-32"
    >
      {/* Atmospheric lifestyle — heavily washed so the product stays the hero */}
      <motion.div className="absolute inset-0 -z-10 overflow-hidden" style={{ y: bgY }}>
        <Image
          src={timelyImages.lifestyle.creativeStudio}
          alt=""
          fill
          priority
          className="object-cover object-[70%_center] opacity-90"
          sizes="100vw"
        />
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[var(--tl-bg)] from-0% via-[var(--tl-bg)]/92 via-45% to-[var(--tl-bg)]/55 lg:via-[var(--tl-bg)]/88 lg:to-[var(--tl-bg)]/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[var(--tl-bg)] via-transparent to-[var(--tl-bg)]/70"
        aria-hidden
      />

      <div className="tl-container relative z-10 w-full">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="tl-hero-copy relative">
            <motion.p className="tl-label text-[var(--tl-accent)]" {...enter(0.06, reduce)}>
              The smarter way to get paid
            </motion.p>

            <motion.h1 className="tl-display mt-5 text-[var(--tl-ink)]" {...enter(0.12, reduce)}>
              Send invoices.
              <br />
              Get paid.
              <br />
              Stay ahead.
            </motion.h1>

            <motion.p className="tl-body mt-6" {...enter(0.2, reduce)}>
              Invoice, collect and understand your cash flow — without the chasing.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              {...enter(0.28, reduce)}
            >
              <LandingPrimaryLink
                href={routes.auth.register}
                className="h-12 w-full justify-center px-6 sm:w-auto"
              >
                Start for free
              </LandingPrimaryLink>
              <LandingSecondaryLink
                href="#story"
                className="h-12 w-full justify-center px-6 sm:w-auto"
              >
                See how it works
              </LandingSecondaryLink>
            </motion.div>

            <motion.p className="mt-4 text-[13px] text-[var(--tl-ink-3)]" {...enter(0.34, reduce)}>
              No credit card required.
            </motion.p>
          </div>

          <motion.div
            className="tl-hero-visual-wrap min-w-0"
            style={{ y: productY }}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduce ? 0 : 0.32, ease }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
