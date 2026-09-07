'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/settings/admin-ui';
import { Button } from '@/components/ui/Button';
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
    <SettingsWorkspace>
      <AdminPanel
        kicker="Time tracking"
        description="Track billable hours and turn work into invoices."
        className="flex min-h-0 w-full flex-1 flex-col items-center text-center"
        bodyClassName="mt-0 flex w-full flex-col items-center"
      >
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--tl-accent)_12%,white)] text-[var(--tl-accent)] ring-1 ring-[color-mix(in_srgb,var(--tl-accent)_18%,transparent)]">
          <Clock className="h-6 w-6" aria-hidden />
        </div>

        {loading ? (
          <>
            <Skeleton className="mx-auto mt-5 h-7 max-w-sm rounded-[var(--tl-radius-sm)]" />
            <Skeleton className="mx-auto mt-3 h-16 max-w-md rounded-[var(--tl-radius-sm)]" />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Skeleton className="h-10 w-40 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </>
        ) : error ? (
          <div className="mt-5 w-full max-w-md">
            <AdminAlertBanner tone="error">{error}</AdminAlertBanner>
          </div>
        ) : (
          <>
            <h2 className="mt-5 ti-h3 text-[var(--tl-ink)]">{data?.headline ?? 'Time tracking'}</h2>
            <p className="mx-auto mt-2 max-w-md ti-body leading-relaxed text-[var(--tl-ink-2)]">{data?.description}</p>
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
      </AdminPanel>
    </SettingsWorkspace>
  );
}
