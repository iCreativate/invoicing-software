'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordResetOk = searchParams.get('passwordReset') === '1';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.assign(nextPath);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your work email to open your dashboard, invoices, and client portal."
    >
      <Card className="border-border/80 bg-card/80 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both] sm:p-8">
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

          <Button type="submit" disabled={submitting} className="h-12 w-full text-base shadow-[var(--shadow-md)]">
            {submitting ? 'Signing in…' : 'Sign in'}
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
