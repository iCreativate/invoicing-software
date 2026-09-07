import type { HTMLAttributes } from 'react';
import { Surface } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

/** @deprecated Prefer Surface from @/components/ui. */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Surface variant="elevated" className={cn('text-card-foreground', className)} {...props} />;
}

export { Surface };
