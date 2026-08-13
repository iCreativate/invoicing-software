'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

function formatWhen(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load');
        if (!cancelled) setRows((json.data ?? []) as NotificationRow[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Notifications">
      <PageBody>
        <PageHeader title="Notification centre" description="Workspace events for your TimelyInvoices account." />

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {!loading && !error ? (
          <GlassCard className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-auto">
            {rows.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              rows.map((n) => {
                const inner = (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-foreground">{n.title}</span>
                      <span className="text-[11px] text-muted-foreground">{formatWhen(n.createdAt)}</span>
                    </div>
                    {n.body ? <p className="mt-1 text-sm text-muted-foreground">{n.body}</p> : null}
                  </>
                );
                return (
                  <div key={n.id} className="px-4 py-4">
                    {n.href ? (
                      <Link href={n.href} className="block transition-colors hover:opacity-90">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </div>
                );
              })
            )}
          </GlassCard>
        ) : null}
      </PageBody>
    </AppShell>
  );
}
