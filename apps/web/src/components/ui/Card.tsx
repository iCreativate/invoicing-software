import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] bg-card text-card-foreground shadow-[var(--shadow-sm)]',
        'transition duration-200 will-change-transform hover:-translate-y-1 hover:shadow-[var(--shadow-md)]',
        className
      )}
      {...props}
    />
  );
}

