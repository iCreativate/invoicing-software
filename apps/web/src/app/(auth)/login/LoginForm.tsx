'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient, clearSupabaseBrowserInert, markSupabaseBrowserInert, purgeBrowserSupabaseAuth } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { Card } from '@/components/ui/Card';
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
    <AuthShell
      title="Welcome back"
      subtitle={
        supabaseDown
          ? 'Supabase is unreachable right now. Use the sample dashboard, or restore NEXT_PUBLIC_SUPABASE_URL in apps/web/.env.local.'
          : 'Sign in with your work email to open your dashboard, invoices, and client portal.'
      }
    >
      <Card className="border-border/80 bg-card/80 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both] sm:p-8">
        {supabaseDown ? (
          <div className="mb-6 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground" role="status">
              Configured project host does not resolve. Real sign-in will keep failing until you point{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">apps/web/.env.local</code> at a live Supabase
              project.
            </div>
            {showDemo ? (
              <Button
                type="button"
                disabled={submitting}
                className="h-12 w-full text-base shadow-[var(--shadow-md)]"
                onClick={() => void enterCookieDemo()}
              >
                {submitting ? 'Opening…' : 'Continue with sample dashboard'}
              </Button>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5" aria-describedby={error ? 'login-error' : undefined}>
            {passwordResetOk ? (
              <div className="rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success" role="status">
                Password updated. Sign in with your new password.
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Link
                  href={
                    email.trim()
                      ? `${routes.auth.forgotPassword}?email=${encodeURIComponent(email.trim())}`
                      : routes.auth.forgotPassword
                  }
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {error ? (
              <div
                id="login-error"
                className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={submitting || reach === 'checking'} className="h-12 w-full text-base shadow-[var(--shadow-md)]">
              {submitting ? 'Signing in…' : reach === 'checking' ? 'Checking connection…' : 'Sign in'}
            </Button>
        </form>

        <div className="mt-6 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
          New to TimelyInvoices?{' '}
          <Link href={routes.auth.register} className="font-semibold text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
