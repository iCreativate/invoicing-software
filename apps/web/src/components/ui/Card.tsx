import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const surfaceVariants = cva('', {
  variants: {
    variant: {
      primary: 'ti-surface-primary',
      secondary: 'ti-surface-secondary',
      elevated: 'ti-surface-elevated',
      dark: 'ti-surface-dark',
      interactive: 'ti-surface-interactive',
      flush: 'ti-surface-flush',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof surfaceVariants>;

export function Surface({ className, variant, ...props }: SurfaceProps) {
  return <div className={cn(surfaceVariants({ variant }), className)} {...props} />;
}

export { surfaceVariants };

const cardVariants = cva('text-card-foreground', {
  variants: {
    variant: {
      default: 'card',
      flush: 'card-flush',
      panel: 'card-panel',
      highlight: 'card-highlight',
      elevated: 'card-elevated',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ variant }),
        'data-[interactive=true]:card-interactive',
        '[&.ti-interactive]:card-interactive',
        className
      )}
      {...props}
    />
  );
}

/** @deprecated Use Surface. Kept for existing imports. */
export function GlassCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <Surface variant="primary" className={cn('text-card-foreground', className)} {...props}>
      {children}
    </Surface>
  );
}
