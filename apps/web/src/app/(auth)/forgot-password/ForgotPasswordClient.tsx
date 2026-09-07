'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getPublicAppOrigin } from '@/lib/app-url';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field } from '@/components/ui/Field';
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
    const origin = getPublicAppOrigin();
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
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={sent ? undefined : 'We’ll send a link to choose a new password.'}
    >
      {sent ? (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-[var(--tl-ink-2)]" role="status">
            If an account exists for <span className="font-medium text-[var(--tl-ink)]">{email.trim()}</span>, you’ll
            receive an email shortly. Check your inbox and spam folder.
          </p>
          <Button asChild className="h-11 w-full" variant="secondary">
            <Link href={routes.auth.login}>Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" aria-describedby={error ? 'forgot-error' : undefined}>
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

          {error ? (
            <div id="forgot-error" className="ti-error" role="alert">
              <div className="font-medium">Couldn&apos;t send reset link</div>
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}

          <Button type="submit" loading={submitting} className="h-11 w-full">
            Send reset link
          </Button>
        </form>
      )}

      {sent ? null : (
        <p className="mt-8 text-sm text-[var(--tl-ink-2)]">
          <Link href={routes.auth.login} className="font-medium text-[var(--tl-ink)] underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
