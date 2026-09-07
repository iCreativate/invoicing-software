'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminAlertBanner, AdminInfoRow, AdminPanel } from '@/components/settings/admin-ui';
import { Skeleton } from '@/components/ui/Skeleton';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import { isDemoUiActive } from '@/lib/demo/accounts';

export default function SettingsProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (isDemoUiActive()) {
          if (!alive) return;
          setEmail('demo@timelyinvoices.app');
          return;
        }
        const user = await getBrowserUserSafe();
        if (!alive) return;
        setEmail(user?.email ?? null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load profile.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <SettingsWorkspace>
      <div className="flex flex-col gap-4 md:gap-5">
        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

        <div className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--tl-bg)] text-[var(--tl-accent)] ring-1 ring-[var(--tl-line)]">
              <User className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Signed in as</div>
              <div className="mt-0.5 truncate text-[15px] font-semibold text-[var(--tl-ink)]">
                {loading ? 'Loading…' : email ?? '—'}
              </div>
            </div>
          </div>
        </div>

        <AdminPanel kicker="Account" description="Your sign-in email for this workspace." bodyClassName="mt-0">
          {loading ? (
            <div className="space-y-3" aria-busy>
              <Skeleton className="h-20 w-full rounded-[var(--tl-radius-sm)]" />
            </div>
          ) : (
            <AdminInfoRow
              label="Email"
              value={email ?? '—'}
              hint="Email changes can be added next. Password and security live under Security."
            />
          )}
        </AdminPanel>
      </div>
    </SettingsWorkspace>
  );
}
