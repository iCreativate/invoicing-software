'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAlertBanner } from '@/components/settings/admin-ui';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CrewPageHeader,
  CrewPanel,
  EmptyRow,
  KpiCard,
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

type Overview = {
  workspaces: number;
  pendingEfts: number;
  activeSubscriptions: number;
  suspendedAccounts: number;
  terminatedAccounts: number;
  recentSignups: Array<{
    ownerId: string;
    companyName: string | null;
    email: string | null;
    subscriptionPlan: string;
    accountStatus: string;
    createdAt: string;
  }>;
};

export default function CrewOverviewPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/crew/overview', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Overview failed');
      setOverview(json.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <CrewPageHeader
        title="Overview"
        description="Platform health for Timely crew — workspaces, plans, EFT queue, and lifecycle flags."
        actions={
          <Link
            href="/crew/eft"
            className="rounded-full bg-[var(--tl-navy)] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            Review EFT queue
          </Link>
        }
      />

      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {loading || !overview
          ? [1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-[var(--tl-radius-sm)]" />
            ))
          : [
              <KpiCard key="w" label="Workspaces" value={overview.workspaces} />,
              <KpiCard
                key="a"
                label="Active plans"
                value={overview.activeSubscriptions}
                tone="success"
              />,
              <KpiCard
                key="p"
                label="Pending EFTs"
                value={overview.pendingEfts}
                tone={overview.pendingEfts > 0 ? 'warning' : 'default'}
              />,
              <KpiCard
                key="s"
                label="Suspended"
                value={overview.suspendedAccounts}
                tone={overview.suspendedAccounts > 0 ? 'warning' : 'default'}
              />,
              <KpiCard
                key="t"
                label="Terminated"
                value={overview.terminatedAccounts}
                tone={overview.terminatedAccounts > 0 ? 'danger' : 'default'}
              />,
            ]}
      </div>

      <CrewPanel
        title="Recent signups"
        description="Newest company profiles (service-role read)."
        actions={
          <Link href="/crew/accounts" className="ti-caption font-semibold text-[var(--tl-accent,#2563EB)]">
            Search accounts →
          </Link>
        }
      >
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : !overview?.recentSignups?.length ? (
          <EmptyRow>No workspaces yet.</EmptyRow>
        ) : (
          <div className="overflow-x-auto rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentSignups.map((row) => (
                  <TableRow key={row.ownerId}>
                    <TableCell className="font-medium text-[var(--tl-ink)]">
                      {row.companyName || '—'}
                    </TableCell>
                    <TableCell className="text-[var(--tl-ink-2)]">{row.email || '—'}</TableCell>
                    <TableCell>
                      <PlanBadge plan={row.subscriptionPlan} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.accountStatus} />
                    </TableCell>
                    <TableCell className="ti-caption text-[var(--tl-ink-3)]">
                      {formatWhen(row.createdAt)}
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
