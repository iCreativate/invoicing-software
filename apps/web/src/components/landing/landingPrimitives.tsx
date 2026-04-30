'use client';

import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn('py-16 sm:py-20 lg:py-24', className)}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--ti-text-2)' }}>
      {children}
    </div>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'text-balance text-3xl font-semibold leading-[1.07] tracking-[-0.03em] sm:text-4xl',
        className
      )}
    >
      {children}
    </h2>
  );
}

export function PLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mt-4 max-w-2xl text-pretty text-lg leading-[1.75]', className)} style={{ color: 'var(--ti-text-2)' }}>
      {children}
    </p>
  );
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function Reveal({
  children,
  className,
  variants = reveal,
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-120px' }}
    >
      {children}
    </motion.div>
  );
}

