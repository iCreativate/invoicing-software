'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/routing/routes';
import { fetchClientsList } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { Skeleton } from '@/components/ui/Skeleton';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? 'C';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase();
}

export default function ClientsPage() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchClientsList();
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load clients. Ensure Supabase tables exist.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => `${c.name} ${c.email ?? ''} ${c.companyName ?? ''}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <AppShell
      title="Clients"
      actions={
        canMutate ? (
          <Link href={`${routes.app.clients}/new`}>
            <Button>New client</Button>
          </Link>
        ) : null
      }
    >
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">All clients</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {loading ? 'Loading…' : `${filtered.length} client(s)`}
            </div>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients…" />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            No clients yet. Create your first client.
            <div className="mt-3">
              {canMutate ? (
                <Link href={`${routes.app.clients}/new`}>
                  <Button>New client</Button>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading && !error ? (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border p-4 shadow-none">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-full max-w-xs" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="border-b border-border px-3 py-2">Client</th>
                    <th className="border-b border-border px-3 py-2">Email</th>
                    <th className="border-b border-border px-3 py-2">Status</th>
                    <th className="border-b border-border px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="text-sm">
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-2xl" />
                          <Skeleton className="h-5 w-40" />
                        </div>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <Skeleton className="h-5 w-36" />
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <Skeleton className="h-6 w-14 rounded-full" />
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-right dark:border-zinc-900">
                        <Skeleton className="ml-auto h-9 w-24" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {!loading && !error && filtered.length > 0 ? (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {filtered.map((c) => (
                <Card key={c.id} className="border border-border p-4 shadow-none">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      {c.companyName ? (
                        <div className="mt-0.5 text-sm text-muted-foreground">{c.companyName}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground/80">ID: {c.id.slice(0, 8)}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{c.email ?? '—'}</div>
                      <div className="mt-2">
                        <Badge variant="success">Active</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                        <Link href={`${routes.app.clients}/${c.id}`}>
                          <Button variant="secondary" className="h-9">
                            View
                          </Button>
                        </Link>
                        {canMutate ? (
                          <Link href={`${routes.app.clients}/${c.id}/edit`}>
                            <Button className="h-9">Edit</Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="border-b border-border px-3 py-2">Client</th>
                    <th className="border-b border-border px-3 py-2">Email</th>
                    <th className="border-b border-border px-3 py-2">Status</th>
                    <th className="border-b border-border px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="text-sm">
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-foreground">{c.name}</div>
                            {c.companyName ? (
                              <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.companyName}</div>
                            ) : null}
                            <div className="mt-0.5 text-xs text-muted-foreground/80">ID: {c.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-muted-foreground dark:border-zinc-900">
                        {c.email ?? '—'}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-right dark:border-zinc-900">
                        <div className="inline-flex items-center gap-2">
                          <Link href={`${routes.app.clients}/${c.id}`}>
                            <Button variant="secondary" className="h-9">
                              View
                            </Button>
                          </Link>
                          {canMutate ? (
                            <Link href={`${routes.app.clients}/${c.id}/edit`}>
                              <Button className="h-9">Edit</Button>
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </Card>
    </AppShell>
  );
}

