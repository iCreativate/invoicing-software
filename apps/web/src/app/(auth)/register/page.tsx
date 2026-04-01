import { Suspense } from 'react';
import { RegisterClient } from './RegisterClient';
import { Skeleton } from '@/components/ui/Skeleton';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-dvh bg-background px-4 py-10">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1100px_560px_at_18%_0%,hsl(var(--primary)/0.18),transparent_58%)]" aria-hidden />
          <div className="mx-auto w-full max-w-lg space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-5 w-full max-w-md" />
            </div>
            <Skeleton className="h-[28rem] w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
