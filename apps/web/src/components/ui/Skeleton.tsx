import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-muted/60 motion-reduce:animate-none dark:bg-white/10',
        className
      )}
      aria-hidden
    />
  );
}
