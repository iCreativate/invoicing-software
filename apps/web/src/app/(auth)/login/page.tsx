import { Suspense } from 'react';
import { routes } from '@/lib/routing/routes';
import { LoginForm } from './LoginForm';
import { Skeleton } from '@/components/ui/Skeleton';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = searchParams?.next || routes.app.dashboard;
  return (
    <Suspense
      fallback={
        <div className="relative min-h-dvh bg-background px-4 py-10">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1100px_560px_at_18%_0%,hsl(var(--primary)/0.18),transparent_58%)]" aria-hidden />
          <div className="mx-auto w-full max-w-lg space-y-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <LoginForm nextPath={nextPath} />
    </Suspense>
  );
}

