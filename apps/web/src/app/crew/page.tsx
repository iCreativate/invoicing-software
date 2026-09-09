'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminAlertBanner, AdminPanel } from '@/components/settings/admin-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format/money';

type Overview = {
  pendingEfts: number;
  activeSubscriptions: number;
  suspendedAccounts: number;
  terminatedAccounts: number;
};

type EftItem = {
  id: string;
  ownerId: string;
  plan: string;
  amountCents: number;
  reference: string;
  status: string;
  note: string | null;
  createdAt: string;
  company: { companyName: string | null; email: string | null } | null;
};

type AccountItem = {
  ownerId: string;
  companyName: string | null;
  email: string | null;
  subscriptionPlan: string;
  accountStatus: string;
  subscription: { plan: string; status: string; currentPeriodEnd: string | null } | null;
};

export default function CrewConsolePage() {
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [efts, setEfts] = useState<EftItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ovRes, eftRes] = await Promise.all([
        fetch('/api/crew/overview', { credentials: 'include' }),
        fetch('/api/crew/eft?status=pending', { credentials: 'include' }),
      ]);
      if (ovRes.status === 401 || ovRes.status === 403 || eftRes.status === 401 || eftRes.status === 403) {
        setForbidden(true);
        return;
      }
      const ovJson = await ovRes.json();
      const eftJson = await eftRes.json();
      if (!ovRes.ok || !ovJson?.success) throw new Error(ovJson?.error ?? 'Overview failed');
      if (!eftRes.ok || !eftJson?.success) throw new Error(eftJson?.error ?? 'EFT queue failed');
      setOverview(ovJson.data);
      setEfts(eftJson.data?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load crew console');
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function searchAccounts() {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/crew/accounts?q=${encodeURIComponent(q.trim())}`, {
        credentials: 'include',
      });
      if (res.status === 403 || res.status === 401) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Search failed');
      setAccounts(json.data?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
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
      await searchAccounts();
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <AdminAlertBanner tone="error">You do not have access to the Timely crew console.</AdminAlertBanner>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
      <div>
        <p className="ti-caption uppercase tracking-wide text-[var(--tl-ink-3)]">Timely internal</p>
        <h1 className="ti-h2 mt-1 text-[var(--tl-ink)]">Crew console</h1>
        <p className="ti-body mt-1 text-[var(--tl-ink-2)]">
          Review EFT claims and manage account lifecycle. Actions are audited.
        </p>
      </div>

      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
      {notice ? <AdminAlertBanner tone="success">{notice}</AdminAlertBanner> : null}

      <AdminPanel kicker="Overview" bodyClassName="mt-0">
        {loading || !overview ? (
          <div className="grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['Pending EFTs', overview.pendingEfts],
              ['Active subs', overview.activeSubscriptions],
              ['Suspended', overview.suspendedAccounts],
              ['Terminated', overview.terminatedAccounts],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3"
              >
                <div className="ti-caption text-[var(--tl-ink-3)]">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--tl-ink)]">{value}</div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      <AdminPanel kicker="EFT queue" title="Pending claims" bodyClassName="mt-4">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : efts.length === 0 ? (
          <p className="ti-body text-[var(--tl-ink-3)]">No pending EFT claims.</p>
        ) : (
          <ul className="divide-y divide-[var(--tl-line)]">
            {efts.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--tl-ink)]">
                      {item.company?.companyName || item.company?.email || item.ownerId.slice(0, 8)}
                    </span>
                    <Badge variant="outline">{item.plan}</Badge>
                    <Badge variant="outline">{item.reference}</Badge>
                  </div>
                  <p className="ti-caption mt-1 text-[var(--tl-ink-3)]">
                    {formatMoney(item.amountCents / 100, 'ZAR')} · {item.company?.email ?? 'no email'} ·{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel kicker="Accounts" title="Search" bodyClassName="mt-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email or company name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void searchAccounts();
            }}
          />
          <Button disabled={searching || q.trim().length < 2} loading={searching} onClick={() => void searchAccounts()}>
            Search
          </Button>
        </div>
        {accounts.length === 0 ? (
          <p className="ti-caption mt-4 text-[var(--tl-ink-3)]">Search to load accounts (min 2 characters).</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--tl-line)]">
            {accounts.map((a) => (
              <li key={a.ownerId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--tl-ink)]">{a.companyName || '—'}</span>
                    <Badge variant="outline">{a.accountStatus}</Badge>
                    <Badge variant="outline">{a.subscriptionPlan}</Badge>
                  </div>
                  <p className="ti-caption mt-1 text-[var(--tl-ink-3)]">
                    {a.email || 'no email'} · sub {a.subscription?.status ?? 'n/a'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
