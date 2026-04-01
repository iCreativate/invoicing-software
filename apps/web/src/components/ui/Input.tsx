import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-[var(--shadow-sm)]',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring/40',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

