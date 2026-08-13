'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/format/money';
import { PLANS, normalizePlanId, type PlanId } from '@/lib/billing/entitlements';
import { cn } from '@/lib/utils/cn';

const DISPLAY_ORDER: PlanId[] = ['free', 'pro', 'business'];

function planLimitsCopy(id: PlanId): string {
  const p = PLANS[id];
  const team = p.entitlements.team_members ?? 1;
  const parts: string[] = [];
  if (id === 'free' || id === 'starter') parts.push('Core invoicing', `${team} user`);
  if (id === 'pro') parts.push('Reminders · Payment links · Cashflow insights', `Up to ${team} users`);
  if (id === 'business') parts.push('Team roles · Advanced reporting · Collections sequences', `Up to ${team} users`);
  return parts.join(' · ');
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') setNotice('Payment received — your plan will activate once PayFast confirms.');
    if (params.get('cancelled') === '1') setNotice('Checkout was cancelled.');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load plan');
        const raw = json?.data?.company?.subscriptionPlan;
        if (!cancelled) setCurrentPlan(normalizePlanId(raw));
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

  async function checkout(plan: PlanId) {
    setBusyPlan(plan);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Checkout failed');
      const url = json?.data?.redirectUrl;
      if (!url) throw new Error('Missing PayFast redirect URL');
      window.location.assign(String(url));
    } catch (e: any) {
      setError(e?.message ?? 'Checkout failed');
      setBusyPlan(null);
    }
  }

  async function cancelSub() {
    setBusyPlan('free');
    setError(null);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Cancel failed');
      setNotice('Cancellation scheduled at period end. You keep access until then.');
    } catch (e: any) {
      setError(e?.message ?? 'Cancel failed');
    } finally {
      setBusyPlan(null);
    }
  }

  const current = PLANS[currentPlan === 'starter' ? 'starter' : currentPlan];
  const paid = currentPlan === 'pro' || currentPlan === 'business';

  return (
    <AppShell title="Billing">
      <PageBody>
        <PageHeader
          title="Subscription"
          description="Upgrade with PayFast (ZAR). Plan changes apply after payment confirmation."
        />

        {loading ? <p className="text-sm text-muted-foreground">Loading plan…</p> : null}
        {error ? (
          <p className="rounded-[var(--ti-radius)] border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {notice ? (
          <p className="rounded-[var(--ti-radius)] border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{notice}</p>
        ) : null}

        <GlassCard className="p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Current plan</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{current.label}</span>
            <Badge variant="outline" className="font-normal">
              {current.priceZarMonthly === 0 ? 'R 0' : `${formatMoney(current.priceZarMonthly, 'ZAR')} / mo`}
            </Badge>
          </div>
          {paid ? (
            <div className="mt-4">
              <Button variant="secondary" disabled={busyPlan !== null} onClick={() => void cancelSub()}>
                Cancel at period end
              </Button>
            </div>
          ) : null}
        </GlassCard>

        <div className="grid min-h-0 flex-1 gap-4 sm:grid-cols-3">
          {DISPLAY_ORDER.map((id) => {
            const p = PLANS[id];
            const isCurrent = normalizePlanId(currentPlan) === id || (currentPlan === 'starter' && id === 'free');
            const canUpgrade = (id === 'pro' || id === 'business') && !isCurrent;
            return (
              <GlassCard
                key={id}
                className={cn(
                  'flex flex-col p-4 transition-[border-color,box-shadow] duration-150',
                  isCurrent && 'border-[var(--ti-brand-accent,#2F6F7E)]/40 shadow-[var(--ti-shadow)]'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{p.label}</div>
                  {isCurrent ? (
                    <Badge variant="outline" className="font-normal">
                      Current
                    </Badge>
                  ) : null}
                </div>
                <div className="ti-num mt-2 text-2xl font-semibold text-foreground">
                  {p.priceZarMonthly === 0 ? 'R 0' : formatMoney(p.priceZarMonthly, 'ZAR')}
                  {p.priceZarMonthly > 0 ? <span className="text-sm font-normal text-muted-foreground"> / mo</span> : null}
                </div>
                <p className="mt-2 flex-1 text-xs text-muted-foreground">{planLimitsCopy(id)}</p>
                {canUpgrade ? (
                  <Button
                    className="mt-4 w-full"
                    disabled={busyPlan !== null}
                    onClick={() => void checkout(id)}
                  >
                    {busyPlan === id ? 'Redirecting…' : `Upgrade to ${p.label}`}
                  </Button>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      </PageBody>
    </AppShell>
  );
}
