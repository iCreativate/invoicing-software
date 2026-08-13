import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('badge', {
  variants: {
    variant: {
      default: 'badge-neutral',
      primary: 'badge-info',
      success: 'badge-success',
      danger: 'badge-danger',
      warning: 'badge-warning',
      outline: 'badge-neutral bg-transparent',
      partial: 'badge-partial',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
