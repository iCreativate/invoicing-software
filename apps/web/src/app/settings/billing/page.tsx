'use client';

import { useEffect, useState } from 'react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/settings/admin-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Amount } from '@/components/ui/Text';
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

type EftBank = {
  bankName: string | null;
  accountNameDisplay: string;
  accountNumber: string | null;
  branchCode: string | null;
  accountType: string | null;
  configured: boolean;
};

type EftPlanAmounts = {
  pro: { amountZar: number; amountCents: number | null };
  business: { amountZar: number; amountCents: number | null };
};

export default function SettingsBillingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [eftBank, setEftBank] = useState<EftBank | null>(null);
  const [eftReference, setEftReference] = useState<string | null>(null);
  const [eftPlans, setEftPlans] = useState<EftPlanAmounts | null>(null);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [eftBusy, setEftBusy] = useState<PlanId | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') setNotice('Payment received — your plan will activate once PayFast confirms.');
    if (params.get('cancelled') === '1') setNotice('Checkout was cancelled.');
    if (params.get('account') === 'suspended') {
      setNotice('This workspace is suspended. Pay by EFT or contact Timely support to reinstate.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [settingsRes, eftRes] = await Promise.all([
          fetch('/api/settings', { credentials: 'include' }),
          fetch('/api/billing/eft/details', { credentials: 'include' }),
        ]);
        const json = await settingsRes.json();
        if (!settingsRes.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load plan');
        const raw = json?.data?.company?.subscriptionPlan;
        if (!cancelled) setCurrentPlan(normalizePlanId(raw));

        if (eftRes.ok) {
          const eftJson = await eftRes.json();
          if (eftJson?.success && !cancelled) {
            setEftBank(eftJson.data.bank);
            setEftReference(eftJson.data.reference);
            setEftPlans(eftJson.data.plans);
            setPendingClaims(eftJson.data.pendingClaims ?? []);
          }
        }
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

  async function claimEft(plan: PlanId) {
    if (plan !== 'pro' && plan !== 'business') return;
    setEftBusy(plan);
    setError(null);
    try {
      const res = await fetch('/api/billing/eft/claim', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Could not submit EFT claim');
      setNotice(json?.data?.message ?? 'EFT claim submitted — pending confirmation.');
      setPendingClaims((prev) => [json.data.claim, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? 'EFT claim failed');
    } finally {
      setEftBusy(null);
    }
  }

  const current = PLANS[currentPlan === 'starter' ? 'starter' : currentPlan];
  const paid = currentPlan === 'pro' || currentPlan === 'business';

  return (
    <SettingsWorkspace>
      <div className="flex flex-col gap-4 md:gap-5">
        <p className="ti-body text-[var(--tl-ink-2)]">
          Upgrade with PayFast (ZAR) or Pay by EFT. Plan changes apply after payment confirmation.
        </p>

        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
        {notice ? <AdminAlertBanner tone="info">{notice}</AdminAlertBanner> : null}

        <AdminPanel kicker="Current plan" bodyClassName="mt-0">
          {loading ? (
            <div className="space-y-3" aria-busy>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-48 rounded-[var(--tl-radius-sm)]" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="ti-h3 text-[var(--tl-ink)]">{current.label}</span>
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
            </>
          )}
        </AdminPanel>

        <div className="grid min-h-0 flex-1 gap-4 sm:grid-cols-3">
          {DISPLAY_ORDER.map((id) => {
            const p = PLANS[id];
            const isCurrent = normalizePlanId(currentPlan) === id || (currentPlan === 'starter' && id === 'free');
            const canUpgrade = (id === 'pro' || id === 'business') && !isCurrent;

            if (loading) {
              return <Skeleton key={id} className="h-48 w-full rounded-[var(--tl-radius-sm)]" />;
            }

            return (
              <div
                key={id}
                className={cn(
                  'flex flex-col rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white p-5 shadow-[var(--shadow-elevated)] sm:p-6 transition-[border-color,box-shadow] duration-150',
                  isCurrent && 'border-[color-mix(in_srgb,var(--tl-accent)_35%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--tl-accent)_20%,transparent)]'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-semibold text-[var(--tl-ink)]">{p.label}</div>
                  {isCurrent ? (
                    <Badge variant="outline" className="font-normal">
                      Current
                    </Badge>
                  ) : null}
                </div>
                <Amount display className="mt-2 text-[var(--tl-ink)]">
                  {p.priceZarMonthly === 0 ? 'R 0' : formatMoney(p.priceZarMonthly, 'ZAR')}
                  {p.priceZarMonthly > 0 ? (
                    <span className="ti-caption ml-1 font-normal text-[var(--tl-ink-3)]">/ mo</span>
                  ) : null}
                </Amount>
                <p className="mt-2 flex-1 ti-caption leading-relaxed text-[var(--tl-ink-3)]">{planLimitsCopy(id)}</p>
                {canUpgrade ? (
                  <Button className="mt-4 w-full" disabled={busyPlan !== null} onClick={() => void checkout(id)}>
                    {busyPlan === id ? 'Redirecting…' : `Upgrade to ${p.label}`}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        <AdminPanel kicker="Pay by EFT" title="Bank transfer (Pro / Business)" bodyClassName="mt-4">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : !eftBank?.configured ? (
            <AdminAlertBanner tone="warning">
              Pay by EFT is not configured on this environment yet. Use PayFast checkout, or ask Timely to set bank
              env vars.
            </AdminAlertBanner>
          ) : (
            <div className="space-y-4">
              <p className="ti-body text-[var(--tl-ink-2)]">
                Transfer the plan amount and use your unique reference so we can match the payment. Then tap
                &quot;I&apos;ve paid&quot; — activation is manual after confirmation.
              </p>
              <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
                <div>
                  <dt className="ti-caption text-[var(--tl-ink-3)]">Bank</dt>
                  <dd className="font-medium text-[var(--tl-ink)]">{eftBank.bankName}</dd>
                </div>
                <div>
                  <dt className="ti-caption text-[var(--tl-ink-3)]">Account</dt>
                  <dd className="font-medium text-[var(--tl-ink)]">{eftBank.accountNameDisplay}</dd>
                </div>
                <div>
                  <dt className="ti-caption text-[var(--tl-ink-3)]">Account number</dt>
                  <dd className="font-medium text-[var(--tl-ink)]">{eftBank.accountNumber}</dd>
                </div>
                <div>
                  <dt className="ti-caption text-[var(--tl-ink-3)]">Branch code</dt>
                  <dd className="font-medium text-[var(--tl-ink)]">{eftBank.branchCode}</dd>
                </div>
                <div>
                  <dt className="ti-caption text-[var(--tl-ink-3)]">Account type</dt>
                  <dd className="font-medium text-[var(--tl-ink)]">{eftBank.accountType || '—'}</dd>
                </div>
                <div>
                  <dt className="ti-caption text-[var(--tl-ink-3)]">Your reference</dt>
                  <dd className="font-medium text-[var(--tl-ink)]">{eftReference}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={eftBusy !== null || currentPlan === 'pro'}
                  loading={eftBusy === 'pro'}
                  onClick={() => void claimEft('pro')}
                >
                  I&apos;ve paid — Pro ({formatMoney(eftPlans?.pro.amountZar ?? 59, 'ZAR')})
                </Button>
                <Button
                  variant="secondary"
                  disabled={eftBusy !== null || currentPlan === 'business'}
                  loading={eftBusy === 'business'}
                  onClick={() => void claimEft('business')}
                >
                  I&apos;ve paid — Business ({formatMoney(eftPlans?.business.amountZar ?? 799, 'ZAR')})
                </Button>
              </div>
              {pendingClaims.length > 0 ? (
                <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3">
                  <p className="ti-caption text-[var(--tl-ink-3)]">Pending claims</p>
                  <ul className="mt-2 space-y-1 text-[13px] text-[var(--tl-ink-2)]">
                    {pendingClaims.map((c) => (
                      <li key={String(c.id)}>
                        {String(c.plan)} · {String(c.reference)} · awaiting confirmation
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </AdminPanel>
      </div>
    </SettingsWorkspace>
  );
}
