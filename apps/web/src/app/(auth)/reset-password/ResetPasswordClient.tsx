'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !cancelled) {
        setReady(true);
        setChecking(false);
      }
    });

    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setReady(true);
        setChecking(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      const {
        data: { session: s2 },
      } = await supabase.auth.getSession();
      if (s2?.user) {
        setReady(true);
      }
      setChecking(false);
    };

    void run();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setSubmitting(false);
    router.push(`${routes.auth.login}?passwordReset=1`);
    router.refresh();
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a strong password you have not used elsewhere."
    >
      <Card className="border-border/80 bg-card/80 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both] sm:p-8">
        {checking ? (
          <p className="text-center text-sm text-muted-foreground">Checking your reset link…</p>
        ) : !ready ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Link href={routes.auth.forgotPassword}>
              <Button variant="primary" className="w-full">
                Request new link
              </Button>
            </Link>
            <Link href={routes.auth.login} className="block text-sm font-semibold text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" aria-describedby={error ? 'reset-error' : undefined}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                New password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirm">
                Confirm password
              </label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>

            {error ? (
              <div id="reset-error" className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger" role="alert">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={submitting} className="h-12 w-full text-base shadow-[var(--shadow-md)]">
              {submitting ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        )}

        {ready ? (
          <div className="mt-6 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
            <Link href={routes.auth.login} className="font-semibold text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : null}
      </Card>
    </AuthShell>
  );
}
