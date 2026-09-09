'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthPasswordField } from '@/components/auth/AuthPasswordField';
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

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <AuthShell
      title={checking ? 'Opening reset link' : ready ? 'Choose a new password' : 'Link expired'}
      kicker="Account"
      subtitle={ready ? 'Use a password you haven’t used elsewhere.' : undefined}
    >
      {checking ? (
        <p className="text-sm text-[var(--tl-ink-2)]">Checking your reset link…</p>
      ) : !ready ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-[var(--tl-ink-2)]">
            This reset link is invalid or has expired. Request a new one from the sign-in page.
          </p>
          <Button asChild className="h-11 w-full">
            <Link href={routes.auth.forgotPassword}>Request new link</Link>
          </Button>
          <p className="text-sm text-[var(--tl-ink-2)]">
            <Link href={routes.auth.login} className="font-medium text-[var(--tl-ink)] underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" aria-describedby={error ? 'reset-error' : undefined}>
          <AuthPasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters."
          />
          <AuthPasswordField
            id="confirm"
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            required
            minLength={8}
            error={mismatch ? 'Passwords do not match.' : undefined}
          />

          {error ? (
            <div id="reset-error" className="ti-error" role="alert">
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}

          <Button type="submit" loading={submitting} className="h-11 w-full">
            Update password
          </Button>
        </form>
      )}

      {ready ? (
        <p className="ti-small mt-8 border-t border-[var(--tl-line)] pt-6 text-[var(--tl-ink-2)]">
          <Link href={routes.auth.login} className="font-medium text-[var(--tl-ink)] underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
