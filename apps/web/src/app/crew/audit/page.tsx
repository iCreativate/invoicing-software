'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminAlertBanner } from '@/components/settings/admin-ui';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CrewPageHeader,
  CrewPanel,
  EmptyRow,
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

type AuditItem = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  targetOwnerId: string | null;
  entityType: string | null;
  entityId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export default function CrewAuditPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AuditItem[]>([]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/crew/audit?limit=100', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Audit failed');
      setItems(json.data?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load audit log');
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
        title="Audit log"
        description="Crew actions written to crew_audit_log (approve/reject, suspend/reinstate/terminate)."
      />

      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

      <CrewPanel title="Recent crew actions">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : items.length === 0 ? (
          <EmptyRow>No crew audit entries yet.</EmptyRow>
        ) : (
          <div className="overflow-x-auto rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="ti-caption whitespace-nowrap text-[var(--tl-ink-3)]">
                      {formatWhen(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--tl-ink-2)]">
                      {item.actorEmail || item.actorUserId?.slice(0, 8) || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.action}</Badge>
                    </TableCell>
                    <TableCell className="ti-caption text-[var(--tl-ink-3)]">
                      {item.targetOwnerId ? (
                        <span title={item.targetOwnerId}>{item.targetOwnerId.slice(0, 8)}…</span>
                      ) : (
                        '—'
                      )}
                      {item.entityType ? (
                        <span className="ml-1 text-[var(--tl-ink-3)]">· {item.entityType}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <code className="block truncate rounded bg-[var(--tl-bg)] px-1.5 py-0.5 text-[11px] text-[var(--tl-ink-2)]">
                        {JSON.stringify(item.meta ?? {})}
                      </code>
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
