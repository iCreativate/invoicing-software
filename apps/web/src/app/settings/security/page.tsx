'use client';

import { useEffect, useState } from 'react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/settings/admin-ui';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function SettingsSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!isDemoUiActive()) await getBrowserUserSafe();
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Failed to load account.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const updatePassword = async () => {
    if (isDemoUiActive()) {
      setError('Sample mode is view-only. Connect a live Supabase project to change passwords.');
      return;
    }
    setOk(null);
    setError(null);
    const p1 = newPassword.trim();
    const p2 = confirmPassword.trim();
    if (p1.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (p1 !== p2) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updErr } = await supabase.auth.updateUser({ password: p1 });
      if (updErr) throw updErr;
      setOk('Password updated.');
      notifySuccess('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to update password.';
      setError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsWorkspace>
      <div className="flex flex-col gap-4 md:gap-5">
        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
        {ok ? <AdminAlertBanner tone="success">{ok}</AdminAlertBanner> : null}

        <AdminPanel kicker="Security" description="Change the password for this account." bodyClassName="mt-0">
          {loading ? (
            <div className="grid max-w-md gap-3" aria-busy>
              <Skeleton className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
              <Skeleton className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          ) : (
            <div className="grid max-w-md gap-4">
              <Field label="New password" htmlFor="new-password">
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={saving}
                />
              </Field>
              <Field label="Confirm password" htmlFor="confirm-password">
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  disabled={saving}
                />
              </Field>
              <div>
                <Button type="button" onClick={updatePassword} disabled={saving}>
                  {saving ? 'Saving…' : 'Update password'}
                </Button>
              </div>
            </div>
          )}
        </AdminPanel>
      </div>
    </SettingsWorkspace>
  );
}
