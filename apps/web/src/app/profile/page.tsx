'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    <AppShell title="Profile">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <Card className="flex min-h-0 flex-1 flex-col overflow-auto p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Account</div>
              <div className="mt-1 text-sm text-muted-foreground">Manage your sign-in details.</div>
            </div>
          </div>

          {error ? <div className="mt-4 rounded-[var(--ti-radius)] border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {ok ? <div className="mt-4 rounded-[var(--ti-radius)] border border-success/25 bg-success/10 p-3 text-sm text-success">{ok}</div> : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="ti-surface rounded-[var(--ti-radius)] bg-muted/40 p-4">
              <div className="text-sm font-semibold tracking-tight">Email</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {loading ? 'Loading…' : email ? email : '—'}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Email changes can be added next.</div>
            </div>

            <div className="ti-surface rounded-[var(--ti-radius)] bg-muted/40 p-4">
              <div className="text-sm font-semibold tracking-tight">Change password</div>
              <div className="mt-3 grid gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={loading || saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    disabled={loading || saving}
                  />
                </div>
                <div>
                  <Button type="button" onClick={updatePassword} disabled={loading || saving}>
                    {saving ? 'Saving…' : 'Update password'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

