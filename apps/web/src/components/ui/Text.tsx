import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const VARIANT_CLASS = {
  display: 'ti-display',
  h1: 'ti-h1',
  h2: 'ti-h2',
  h3: 'ti-h3',
  body: 'ti-body',
  small: 'ti-small',
  caption: 'ti-caption',
  financialDisplay: 'ti-financial-display',
  financialValue: 'ti-financial-value',
  meta: 'ti-meta',
} as const;

const VARIANT_TAG = {
  display: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  small: 'p',
  caption: 'p',
  financialDisplay: 'p',
  financialValue: 'span',
  meta: 'p',
} as const;

export type TextVariant = keyof typeof VARIANT_CLASS;

export function Text({
  variant = 'body',
  as,
  className,
  children,
}: {
  variant?: TextVariant;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div' | 'label';
  className?: string;
  children: ReactNode;
}) {
  const Tag = (as ?? VARIANT_TAG[variant]) as 'p';
  return <Tag className={cn(VARIANT_CLASS[variant], className)}>{children}</Tag>;
}

export function Amount({
  children,
  display = false,
  className,
}: {
  children: ReactNode;
  display?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(display ? 'ti-financial-display' : 'ti-financial-value', className)}>
      {children}
    </span>
  );
}
