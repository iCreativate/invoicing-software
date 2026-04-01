'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ForgotPasswordClient({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}${routes.auth.resetPassword}`,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you use for TimelyInvoices. We will send you a link to choose a new password."
    >
      <Card className="border-border/80 bg-card/80 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both] sm:p-8">
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>, you will receive an
              email with a link to reset your password. Check your inbox and spam folder.
            </p>
            <Link href={routes.auth.login}>
              <Button variant="secondary" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" aria-describedby={error ? 'forgot-error' : undefined}>
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

            {error ? (
              <div id="forgot-error" className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger" role="alert">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={submitting} className="h-12 w-full text-base shadow-[var(--shadow-md)]">
              {submitting ? 'Sending link…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
          <Link href={routes.auth.login} className="font-semibold text-foreground underline-offset-4 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
