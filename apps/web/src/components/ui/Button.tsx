import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
    'disabled:pointer-events-none disabled:opacity-50',
    'min-h-11 px-4',
    'shadow-[var(--shadow-sm)]',
    'transition duration-200',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[var(--shadow-md)] hover:brightness-[1.05] hover:shadow-[var(--shadow-lg)]',
        secondary:
          'bg-white/70 text-foreground hover:bg-white/90 dark:bg-card/60 dark:hover:bg-card/80',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        danger: 'bg-danger text-danger-foreground hover:bg-danger/90',
        ghost: 'bg-transparent text-foreground hover:bg-accent/60',
      },
      size: {
        sm: 'min-h-9 px-3 text-sm',
        md: 'min-h-11 px-4 text-sm',
        lg: 'min-h-12 px-5 text-base',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { buttonVariants };

