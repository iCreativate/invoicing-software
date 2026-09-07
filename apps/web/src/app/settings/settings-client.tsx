'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminPanel } from '@/components/settings/admin-ui';
import CompanyProfileClient, { type CompanyProfileActions } from '@/app/company/company-client';
import { Button } from '@/components/ui/Button';
import { ensureReferralCode, fetchMyReferralRewards, type ReferralRewardRow } from '@/features/company/api';
import { routes } from '@/lib/routing/routes';
import { notifySuccess } from '@/lib/notify';

export default function SettingsClient() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [rewards, setRewards] = useState<ReferralRewardRow[]>([]);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [profileActions, setProfileActions] = useState<CompanyProfileActions | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const code = await ensureReferralCode();
        if (alive && code) setReferralCode(code);
        const rw = await fetchMyReferralRewards().catch(() => []);
        if (alive) setRewards(rw);
      } catch {
        if (alive) setRewards([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <SettingsWorkspace
      actions={
        profileActions ? (
          <Button
            onClick={profileActions.onSave}
            disabled={profileActions.disabled}
            loading={profileActions.saving}
          >
            {profileActions.saving ? 'Saving…' : 'Save workspace'}
          </Button>
        ) : null
      }
    >
      <CompanyProfileClient onRegisterActions={setProfileActions} />

      <AdminPanel kicker="Referrals" description="Invite others and track reward history." bodyClassName="mt-0">
        <p className="break-all ti-body text-[var(--tl-ink-2)]">
          Share your link:{' '}
          <span className="font-medium text-[var(--tl-ink)]">
            {origin}
            {routes.auth.register}?ref={referralCode ?? '…'}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!referralCode}
            onClick={() => {
              if (!referralCode) return;
              const url = `${window.location.origin}${routes.auth.register}?ref=${encodeURIComponent(referralCode)}`;
              void navigator.clipboard.writeText(url);
              setCopied(true);
              notifySuccess('Referral link copied.');
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        {rewards.length ? (
          <ul className="mt-5 divide-y divide-[var(--tl-line)] border-t border-[var(--tl-line)]" role="list">
            {rewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-[13px]">
                <span className="text-[var(--tl-ink-2)]">{r.reason}</span>
                <span className="ti-amount font-semibold">
                  {r.amount} {r.currency}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminPanel>

      <AdminPanel
        kicker="People operations"
        description="Payroll and time tracking — available here when you need them."
        bodyClassName="mt-0"
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={routes.app.payroll}>Payroll</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={routes.app.timeTracking}>Time tracking</Link>
          </Button>
        </div>
      </AdminPanel>
    </SettingsWorkspace>
  );
}
