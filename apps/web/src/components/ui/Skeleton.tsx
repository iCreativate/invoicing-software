import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'ti-skeleton rounded-md motion-reduce:animate-none motion-reduce:bg-muted',
        className
      )}
      aria-hidden
    />
  );
}
