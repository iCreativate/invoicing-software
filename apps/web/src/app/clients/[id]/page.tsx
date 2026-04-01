'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { fetchClientDetail, fetchClientInvoiceInsights } from '@/features/clients/api';
import type { ClientDetail, ClientInvoiceInsights } from '@/features/clients/types';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ClientViewPage() {
  const params = useParams();
  const id = String((params as any).id);

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [insights, setInsights] = useState<ClientInvoiceInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, ins] = await Promise.all([fetchClientDetail(id), fetchClientInvoiceInsights(id)]);
        if (!alive) return;
        setClient(c);
        setInsights(ins);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load client.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <AppShell
      title={client?.name ? client.name : 'Client'}
      actions={
        <div className="flex items-center gap-2">
          <Link href={routes.app.clients}>
            <Button variant="secondary">Back</Button>
          </Link>
          <Link href={`${routes.app.clients}/${id}/edit`}>
            <Button>Edit</Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4">
        <Card className="p-5">
          {error ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : client ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground">Email</div>
                <div className="mt-2 text-sm font-semibold">{client.email ?? '—'}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground">Phone</div>
                <div className="mt-2 text-sm font-semibold">{client.phone ?? '—'}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4 sm:col-span-2">
                <div className="text-xs font-semibold text-muted-foreground">Address</div>
                <div className="mt-2 text-sm font-semibold whitespace-pre-wrap">{client.address ?? '—'}</div>
              </div>
            </div>
          ) : null}
        </Card>

        {insights && !loading ? (
          <Card className="p-5 motion-safe:animate-[ti-fade-up_0.4s_ease-out_both]">
            <div className="text-sm font-semibold">Payment behavior</div>
            <p className="mt-1 text-sm text-muted-foreground">Rollups from invoices tied to this client.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-muted/20 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Invoices</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{insights.invoiceCount}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Collected</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(insights.lifetimeCollected, 'ZAR')}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Outstanding</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {formatMoney(insights.outstanding, 'ZAR')}
                </div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Avg days to pay</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {insights.avgDaysToPay != null ? `${insights.avgDaysToPay}d` : '—'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Overdue invoices: {insights.overdueCount}</span>
              <span>Paid (zero balance): {insights.paidCount}</span>
              {insights.lastPaidAt ? <span>Last payment date: {insights.lastPaidAt}</span> : null}
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
