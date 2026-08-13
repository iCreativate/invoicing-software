import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('input', 'disabled:cursor-not-allowed disabled:opacity-60', className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
