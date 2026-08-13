'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { fetchClientDetail, fetchClientInvoiceInsights, fetchClientInvoicesForScore } from '@/features/clients/api';
import type { ClientDetail, ClientInvoiceInsights } from '@/features/clients/types';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/Skeleton';
import { computeTimelyPaymentScore, type TimelyPaymentScore } from '@/lib/clients/paymentScore';

export default function ClientViewPage() {
  const params = useParams();
  const id = String((params as any).id);

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [insights, setInsights] = useState<ClientInvoiceInsights | null>(null);
  const [score, setScore] = useState<TimelyPaymentScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, ins, invs] = await Promise.all([
          fetchClientDetail(id),
          fetchClientInvoiceInsights(id),
          fetchClientInvoicesForScore(id),
        ]);
        if (!alive) return;
        setClient(c);
        setInsights(ins);
        setScore(computeTimelyPaymentScore(invs));
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
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <Card className="flex min-h-0 flex-1 flex-col overflow-auto p-5">
          {error ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : client ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {client.companyName ? (
                <div className="rounded-2xl bg-muted/20 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold text-muted-foreground">Company</div>
                  <div className="mt-2 text-sm font-semibold">{client.companyName}</div>
                </div>
              ) : null}
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground">Email</div>
                <div className="mt-2 text-sm font-semibold">{client.email ?? '—'}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="text-xs font-semibold text-muted-foreground">Phone</div>
                <div className="mt-2 text-sm font-semibold">{client.phone ?? '—'}</div>
              </div>
              {client.website ? (
                <div className="rounded-2xl bg-muted/20 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold text-muted-foreground">Website</div>
                  <a
                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              ) : null}
              {client.companyRegistration ? (
                <div className="rounded-2xl bg-muted/20 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">Registration / CK</div>
                  <div className="mt-2 text-sm font-semibold">{client.companyRegistration}</div>
                </div>
              ) : null}
              {client.vatNumber ? (
                <div className="rounded-2xl bg-muted/20 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">VAT number</div>
                  <div className="mt-2 text-sm font-semibold">{client.vatNumber}</div>
                </div>
              ) : null}
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

        {score && !loading ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Timely Payment Score™</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based only on this client&apos;s invoice history in your workspace.
                </p>
              </div>
              <div className="ti-metric-display text-primary">{score.score}</div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {score.factors.map((f) => (
                <li key={f.key} className="flex justify-between gap-4 border-t border-border pt-2">
                  <span>{f.label}</span>
                  <span className="tabular-nums text-foreground">
                    {f.value == null ? '—' : f.key === 'avg_days_to_pay' ? `${Math.round(f.value)}d` : `${Math.round(f.value * 100)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
