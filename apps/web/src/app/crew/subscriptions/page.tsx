'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminAlertBanner } from '@/components/settings/admin-ui';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CrewPageHeader,
  CrewPanel,
  EmptyRow,
  PlanBadge,
  StatusBadge,
  formatWhen,
} from '@/components/crew/crew-ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SubItem = {
  id: string;
  ownerId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  company: { companyName: string | null; email: string | null; accountStatus: string } | null;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'past_due', label: 'Past due' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'inactive', label: 'Inactive' },
] as const;

export default function CrewSubscriptionsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof FILTERS)[number]['id']>('all');
  const [items, setItems] = useState<SubItem[]>([]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/crew/subscriptions?status=${encodeURIComponent(status)}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Subscriptions failed');
      setItems(json.data?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <CrewPageHeader
        title="Subscriptions"
        description="platform_subscriptions rows across the fleet (service-role)."
      />

      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

      <CrewPanel
        title="Platform subscriptions"
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={
                  status === f.id
                    ? 'rounded-full bg-[var(--tl-navy)] px-3 py-1 text-[12px] font-semibold text-white'
                    : 'rounded-full bg-[var(--tl-bg)] px-3 py-1 text-[12px] font-medium text-[var(--tl-ink-2)] ring-1 ring-[var(--tl-line)]'
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : items.length === 0 ? (
          <EmptyRow>No subscriptions for this filter.</EmptyRow>
        ) : (
          <div className="overflow-x-auto rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period end</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-[var(--tl-ink)]">
                        {item.company?.companyName || item.company?.email || item.ownerId.slice(0, 8)}
                      </div>
                      <div className="ti-caption text-[var(--tl-ink-3)]">
                        {item.company?.email ?? 'no email'}
                        {item.company?.accountStatus
                          ? ` · account ${item.company.accountStatus}`
                          : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={item.plan} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={item.status} />
                        {item.cancelAtPeriodEnd ? (
                          <StatusBadge status="cancel_at_period_end" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="ti-caption text-[var(--tl-ink-3)]">
                      {formatWhen(item.currentPeriodEnd)}
                    </TableCell>
                    <TableCell className="ti-caption text-[var(--tl-ink-3)]">
                      {formatWhen(item.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CrewPanel>
    </div>
  );
}
