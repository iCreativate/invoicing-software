'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred. You can retry or return home.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href={routes.app.dashboard}>Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
