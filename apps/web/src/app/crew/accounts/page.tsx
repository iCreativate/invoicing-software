'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAlertBanner } from '@/components/settings/admin-ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

type AccountItem = {
  ownerId: string;
  companyName: string | null;
  email: string | null;
  subscriptionPlan: string;
  accountStatus: string;
  createdAt?: string | null;
  subscription: { plan: string; status: string; currentPeriodEnd: string | null } | null;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

const PAGE_SIZE = 50;

export default function CrewAccountsPage() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAccounts = useCallback(async (query: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed) params.set('q', trimmed);
      params.set('page', String(pageNum));
      params.set('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/crew/accounts?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load accounts');
      setAccounts(json.data?.items ?? []);
      setPagination(json.data?.pagination ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts(appliedQ, page);
  }, [loadAccounts, appliedQ, page]);

  function runSearch() {
    setPage(1);
    setAppliedQ(q.trim());
  }

  async function accountAction(ownerId: string, action: 'suspend' | 'reinstate' | 'terminate') {
    const ok = window.confirm(
      action === 'terminate'
        ? 'Soft-terminate this account? Data is kept; plan set to free and flagged terminated.'
        : `Confirm ${action} for this account?`
    );
    if (!ok) return;
    setBusyId(ownerId + action);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/crew/accounts/${ownerId}/action`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Action failed');
      setNotice(`Account ${action} applied.`);
      await loadAccounts(appliedQ, page);
    } catch (e: any) {
      setError(e?.message ?? 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <CrewPageHeader
        title="Accounts"
        description="All workspaces (paginated). Filter by email or company. Suspend, reinstate, or soft-terminate — never hard-delete auth."
      />

      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
      {notice ? <AdminAlertBanner tone="success">{notice}</AdminAlertBanner> : null}

      <CrewPanel title="Accounts">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by email or company name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch();
            }}
          />
          <Button loading={loading} onClick={runSearch}>
            {q.trim() ? 'Search' : 'Refresh'}
          </Button>
          {appliedQ ? (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => {
                setQ('');
                setPage(1);
                setAppliedQ('');
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        {loading && accounts.length === 0 ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : accounts.length === 0 ? (
          <EmptyRow>{appliedQ ? 'No matching accounts.' : 'No accounts yet.'}</EmptyRow>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.ownerId}>
                      <TableCell>
                        <div className="font-medium text-[var(--tl-ink)]">{a.companyName || '—'}</div>
                        <div className="ti-caption text-[var(--tl-ink-3)]">{a.email || 'no email'}</div>
                        <div className="ti-caption text-[var(--tl-ink-3)]">
                          sub {a.subscription?.status ?? 'n/a'}
                          {a.subscription?.currentPeriodEnd
                            ? ` · ends ${formatWhen(a.subscription.currentPeriodEnd)}`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanBadge plan={a.subscriptionPlan} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.accountStatus} />
                      </TableCell>
                      <TableCell className="ti-caption text-[var(--tl-ink-3)]">
                        {formatWhen(a.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId !== null || a.accountStatus === 'suspended'}
                            onClick={() => void accountAction(a.ownerId, 'suspend')}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId !== null || a.accountStatus === 'active'}
                            onClick={() => void accountAction(a.ownerId, 'reinstate')}
                          >
                            Reinstate
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busyId !== null || a.accountStatus === 'terminated'}
                            onClick={() => void accountAction(a.ownerId, 'terminate')}
                          >
                            Terminate
                          </Button>
                          <Link
                            href="/settings/billing"
                            className="inline-flex items-center rounded-md px-2 text-[11px] font-medium text-[var(--tl-accent,#2563EB)]"
                            title="Your billing settings (safe link)"
                          >
                            Billing
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="ti-caption text-[var(--tl-ink-3)]">
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
                  {appliedQ ? ` · filter “${appliedQ}”` : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading || !pagination.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading || !pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CrewPanel>
    </div>
  );
}
