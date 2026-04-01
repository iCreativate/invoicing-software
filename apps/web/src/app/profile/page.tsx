'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

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
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!alive) return;
        setEmail(data.user?.email ?? null);
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
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Profile">
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Account</div>
              <div className="mt-1 text-sm text-muted-foreground">Manage your sign-in details.</div>
            </div>
          </div>

          {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {ok ? <div className="mt-4 rounded-2xl bg-success/10 p-3 text-sm text-success">{ok}</div> : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-sm font-semibold">Email</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {loading ? 'Loading…' : email ? email : '—'}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Email changes can be added next.</div>
            </div>

            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-sm font-semibold">Change password</div>
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

