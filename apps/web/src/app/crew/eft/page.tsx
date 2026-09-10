'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminAlertBanner } from '@/components/settings/admin-ui';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format/money';
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

type EftItem = {
  id: string;
  ownerId: string;
  plan: string;
  amountCents: number;
  reference: string;
  status: string;
  note: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  company: { companyName: string | null; email: string | null } | null;
};

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
] as const;

export default function CrewEftPage() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof FILTERS)[number]['id']>('pending');
  const [items, setItems] = useState<EftItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/crew/eft?status=${encodeURIComponent(status)}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'EFT queue failed');
      setItems(json.data?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load EFT queue');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/crew/eft/${id}/approve`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Approve failed');
      setNotice('EFT claim approved — plan activated.');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Approve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const note = window.prompt('Optional reject note (visible to customer notification):') ?? undefined;
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/crew/eft/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || null }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Reject failed');
      setNotice('EFT claim rejected.');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <CrewPageHeader
        title="EFT queue"
        description="Approve or reject Pay-by-EFT claims. Approvals activate the plan via service role."
      />

      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
      {notice ? <AdminAlertBanner tone="success">{notice}</AdminAlertBanner> : null}

      <CrewPanel
        title="Claims"
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
          <EmptyRow>No {status === 'all' ? '' : status + ' '}EFT claims.</EmptyRow>
        ) : (
          <div className="overflow-x-auto rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={item.plan} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(item.amountCents / 100, 'ZAR')}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-[var(--tl-bg)] px-1.5 py-0.5 text-[12px]">
                        {item.reference}
                      </code>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                      {item.note ? (
                        <p className="ti-caption mt-1 max-w-[180px] truncate text-[var(--tl-ink-3)]">
                          {item.note}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="ti-caption text-[var(--tl-ink-3)]">
                      {formatWhen(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'pending' ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={busyId !== null}
                            loading={busyId === item.id}
                            onClick={() => void approve(item.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busyId !== null}
                            onClick={() => void reject(item.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="ti-caption text-[var(--tl-ink-3)]">—</span>
                      )}
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
