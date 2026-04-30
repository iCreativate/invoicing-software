'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: 'var(--ti-border)', color: 'var(--ti-text-2)' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ti-accent)' }} />
      {children}
    </div>
  );
}

export function PremiumButton({
  variant = 'primary',
  className,
  style,
  ...props
}: React.ComponentProps<typeof Button> & { variant?: 'primary' | 'secondary' }) {
  const isPrimary = variant === 'primary';
  return (
    <Button
      {...props}
      variant={isPrimary ? 'primary' : 'secondary'}
      className={cn(
        'rounded-xl shadow-none transition-[transform,filter,box-shadow,border-color] hover:-translate-y-[2px] active:translate-y-0',
        isPrimary ? 'text-white hover:brightness-[1.02] active:brightness-[0.98]' : '',
        className
      )}
      style={{
        ...(isPrimary ? { background: 'var(--ti-accent)' } : null),
        ...style,
      }}
    />
  );
}

export function MetricPill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
}) {
  const styles: Record<string, { bg: string; border: string; fg: string }> = {
    neutral: { bg: 'var(--ti-surface)', border: 'var(--ti-border)', fg: 'var(--ti-text-2)' },
    success: { bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.22)', fg: 'var(--ti-success)' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.26)', fg: 'var(--ti-warning)' },
    danger: { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.22)', fg: 'var(--ti-danger)' },
    info: { bg: 'rgba(11,31,51,0.06)', border: 'rgba(11,31,51,0.16)', fg: 'var(--ti-accent-deep)' },
  };
  const t = styles[tone];
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ background: t.bg, borderColor: t.border, color: t.fg }}>
      {children}
    </span>
  );
}

export function ProductMockupCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px] blur-3xl"
        style={{
          background:
            'radial-gradient(60% 55% at 25% 10%, rgba(15,118,110,0.16), transparent 60%), radial-gradient(55% 50% at 90% 35%, rgba(11,31,51,0.12), transparent 60%)',
        }}
        aria-hidden
      />
      <div className="overflow-hidden rounded-[var(--ti-radius)] border" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)', boxShadow: 'var(--ti-shadow)' }}>
        {children}
      </div>
    </div>
  );
}

export function FeaturePanel({
  eyebrow,
  title,
  body,
  className,
  tone = 'surface',
  rightSlot,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
  tone?: 'surface' | 'muted';
  rightSlot?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn('rounded-[var(--ti-radius)] border p-7 transition-[transform,box-shadow,border-color] hover:-translate-y-[2px]', className)}
      style={{
        borderColor: 'var(--ti-border)',
        background: tone === 'muted' ? 'var(--ti-surface-muted)' : 'var(--ti-surface)',
        boxShadow: 'var(--ti-shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ti-text-2)' }}>
            {eyebrow}
          </div>
          <div className="mt-3 text-xl font-semibold" style={{ color: 'var(--ti-text)' }}>
            {title}
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--ti-text-2)' }}>
            {body}
          </p>
        </div>
        {rightSlot}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

export function PricingCard({
  name,
  price,
  hint,
  highlighted,
  features,
  cta,
  onCta,
}: {
  name: string;
  price: string;
  hint: string;
  highlighted?: boolean;
  features: string[];
  cta: ReactNode;
  onCta?: () => void;
}) {
  return (
    <div
      className={cn('rounded-[var(--ti-radius)] border p-6 transition-[transform,box-shadow,border-color] hover:-translate-y-[2px]', highlighted && 'ring-1')}
      style={{
        borderColor: highlighted ? 'rgba(15,118,110,0.28)' : 'var(--ti-border)',
        background: 'var(--ti-surface)',
        boxShadow: highlighted ? 'var(--ti-shadow-lift)' : 'var(--ti-shadow)',
      }}
    >
      <div className="text-sm font-semibold" style={{ color: 'var(--ti-text)' }}>
        {name}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--ti-text-2)' }}>
        {hint}
      </div>
      <div className="mt-5 text-3xl font-semibold tabular-nums" style={{ color: 'var(--ti-text)' }}>
        {price}
        <span className="text-sm font-medium" style={{ color: 'var(--ti-text-2)' }}>
          /mo
        </span>
      </div>
      <ul className="mt-5 space-y-2 text-sm" style={{ color: 'var(--ti-text-2)' }}>
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ti-accent)' }} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <PremiumButton variant={highlighted ? 'primary' : 'secondary'} className="w-full" onClick={onCta}>
          {cta}
        </PremiumButton>
      </div>
    </div>
  );
}

export function TestimonialQuote({
  quote,
  name,
  location,
  lift,
}: {
  quote: string;
  name: string;
  location: string;
  lift?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <div
      className={cn('rounded-[var(--ti-radius)] border p-7 transition-[transform,box-shadow,border-color] hover:-translate-y-[2px]', lift && 'lg:translate-y-3')}
      style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)', boxShadow: 'var(--ti-shadow)' }}
    >
      <div className="text-sm leading-relaxed" style={{ color: 'var(--ti-text)' }}>
        <span className="text-3xl leading-none" style={{ color: 'rgba(23,32,38,0.22)' }}>
          “
        </span>
        {quote}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full border text-xs font-semibold" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface-muted)', color: 'var(--ti-text)' }}>
          {initials}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--ti-text)' }}>
            {name}
          </div>
          <div className="text-xs" style={{ color: 'var(--ti-text-2)' }}>
            {location}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQAccordion({
  items,
  openIndex,
  onToggle,
}: {
  items: { q: string; a: string }[];
  openIndex: number | null;
  onToggle: (i: number) => void;
}) {
  return (
    <div className="divide-y rounded-[var(--ti-radius)] border" style={{ borderColor: 'var(--ti-border)', background: 'var(--ti-surface)', boxShadow: 'var(--ti-shadow)' }}>
      {items.map((it, i) => {
        const open = openIndex === i;
        return (
          <button key={it.q} type="button" onClick={() => onToggle(i)} className="w-full px-6 py-5 text-left">
            <div className="flex items-center justify-between gap-6">
              <div className="text-sm font-semibold" style={{ color: 'var(--ti-text)' }}>
                {it.q}
              </div>
              <ChevronDown className={cn('h-5 w-5 transition-transform', open ? 'rotate-180' : '')} style={{ color: 'var(--ti-text-2)' }} />
            </div>
            {open ? (
              <div className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ti-text-2)' }}>
                {it.a}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

