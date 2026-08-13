import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Elevated surface panel — same language as Card (border + multi-layer shadow).
 * Kept as GlassCard for import compatibility.
 */
export function GlassCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card text-card-foreground', className)} {...props}>
      {children}
    </div>
  );
}

/** Alias for new code. */
export const Surface = GlassCard;
