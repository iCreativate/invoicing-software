'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient, clearSupabaseBrowserInert, markSupabaseBrowserInert, purgeBrowserSupabaseAuth } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthPasswordField } from '@/components/auth/AuthPasswordField';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { demoLoginsEnabled, friendlyAuthNetworkError } from '@/lib/demo/accounts';

type Reachability = 'checking' | 'ok' | 'down';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reach, setReach] = useState<Reachability>('checking');
  const passwordResetOk = searchParams.get('passwordReset') === '1';
  const showDemo = demoLoginsEnabled();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await fetch('/api/demo/logout', { method: 'POST' });
      } catch {
        // ignore
      }
      clearSupabaseBrowserInert();
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          if (!cancelled) setReach('down');
          return;
        }
        const res = await fetch(`${url}/auth/v1/health`, {
          method: 'GET',
          headers: { apikey: key },
          signal: AbortSignal.timeout(8000),
        });
        if (!cancelled) {
          const ok = res.ok || res.status === 401;
          setReach(ok ? 'ok' : 'down');
        }
      } catch {
        if (!cancelled) setReach('down');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (emailValue: string, passwordValue: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });
      const unconfirmed = String(signInError?.message ?? '').toLowerCase().includes('not confirmed');
      if (unconfirmed) {
        const confirmRes = await fetch('/api/auth/confirm-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailValue }),
        });
        if (confirmRes.ok) {
          ({ error: signInError } = await supabase.auth.signInWithPassword({
            email: emailValue,
            password: passwordValue,
          }));
        }
      }
      if (signInError) {
        setError(friendlyAuthNetworkError(signInError));
        return;
      }
      window.location.assign(nextPath);
    } catch (err) {
      setError(friendlyAuthNetworkError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  const enterCookieDemo = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      if (!res.ok) throw new Error('Could not start demo');
      purgeBrowserSupabaseAuth();
      markSupabaseBrowserInert();
      window.location.assign(routes.app.dashboard);
    } catch {
      setError('Could not start demo mode. Try again.');
      setSubmitting(false);
    }
  };

  const supabaseDown = reach === 'down';

  return (
    <AuthShell title="Sign in to Timely">
      {supabaseDown ? (
        <div className="mb-6 space-y-4">
          <div className="ti-error" role="status">
            <div className="font-medium">Sign-in is temporarily unavailable</div>
            <p className="ti-error-body">Check your internet connection and Supabase project URL, then try again.</p>
          </div>
          {showDemo ? (
            <Button type="button" loading={submitting} className="h-11 w-full" onClick={() => void enterCookieDemo()}>
              Continue with sample dashboard
            </Button>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5" aria-describedby={error ? 'login-error' : undefined}>
        {passwordResetOk ? (
          <div className="border-l-2 border-[var(--tl-success)] py-1 pl-3 text-sm text-[var(--tl-success)]" role="status">
            Password updated. Sign in with your new password.
          </div>
        ) : null}

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </Field>

        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        <p>
          <Link
            href={
              email.trim()
                ? `${routes.auth.forgotPassword}?email=${encodeURIComponent(email.trim())}`
                : routes.auth.forgotPassword
            }
            className="text-sm text-[var(--tl-ink-2)] underline-offset-4 transition-colors hover:text-[var(--tl-ink)] hover:underline"
          >
            Forgot password?
          </Link>
        </p>

        {error ? (
          <div id="login-error" className="ti-error" role="alert">
            <div className="font-medium">Couldn&apos;t sign in</div>
            <p className="ti-error-body">{error}</p>
          </div>
        ) : null}

        <Button type="submit" loading={submitting} disabled={reach === 'checking'} className="h-11 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-sm text-[var(--tl-ink-2)]">
        Don&apos;t have an account?{' '}
        <Link href={routes.auth.register} className="font-medium text-[var(--tl-ink)] underline-offset-4 hover:underline">
          Create account
        </Link>
      </p>
    </AuthShell>
  );
}
