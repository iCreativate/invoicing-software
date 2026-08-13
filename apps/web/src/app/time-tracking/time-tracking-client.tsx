'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';
import type { TimeTrackingApiData } from '@/features/time-tracking/types';
import { Clock } from 'lucide-react';

export default function TimeTrackingClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TimeTrackingApiData | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/time-tracking', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'Failed to load time tracking.');
        }
        if (!alive) return;
        setData(json.data as TimeTrackingApiData);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load time tracking.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell title="Time tracking">
      <Card className="flex min-h-0 w-full flex-1 flex-col items-center justify-center p-8 text-center sm:p-10">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[var(--ti-radius)] bg-[var(--ti-brand-accent,#2F6F7E)]/10 text-[var(--ti-brand-accent,#2F6F7E)]">
          <Clock className="h-6 w-6" />
        </div>
        {loading ? (
          <>
            <Skeleton className="mx-auto mt-4 h-7 max-w-sm" />
            <Skeleton className="mx-auto mt-3 h-16 max-w-md" />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Skeleton className="h-10 w-40 rounded-[var(--ti-radius-sm)]" />
              <Skeleton className="h-10 w-28 rounded-[var(--ti-radius-sm)]" />
            </div>
          </>
        ) : error ? (
          <p className="mt-4 rounded-[var(--ti-radius)] border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : (
          <>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">{data?.headline ?? 'Time tracking'}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{data?.description}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild variant="primary">
                <Link href={`${routes.app.invoices}/new`}>Bill from invoice</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={routes.app.clients}>Clients</Link>
              </Button>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}
