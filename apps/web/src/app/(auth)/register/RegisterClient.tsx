'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getPublicAppOrigin } from '@/lib/app-url';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { timelyImages } from '@/components/landing/timelyAssets';
import { AuthPasswordField } from '@/components/auth/AuthPasswordField';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterClient() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = (searchParams.get('ref') ?? '').trim().toUpperCase();
    if (ref) {
      try {
        sessionStorage.setItem('ti_referrer_code', ref);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let ref = '';
    try {
      ref = sessionStorage.getItem('ti_referrer_code') ?? '';
    } catch {
      ref = '';
    }
    ref = ref || (searchParams.get('ref') ?? '').trim().toUpperCase();

    const data: Record<string, string> = {
      full_name: fullName.trim(),
    };
    if (ref) data.referrer_code = ref;

    const supabase = createSupabaseBrowserClient();
    const origin = getPublicAppOrigin();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}${routes.app.dashboard}`,
        data,
      },
    });

    if (signUpError) {
      setSubmitting(false);
      setError(signUpError.message);
      return;
    }

    const user = signUpData.user;
    const identities = user?.identities ?? [];
    if (user && !signUpData.session && identities.length === 0) {
      setSubmitting(false);
      setError('An account with this email already exists. Sign in instead.');
      return;
    }

    if (!signUpData.session) {
      const confirmRes = await fetch('/api/auth/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId: user?.id }),
      });
      const confirmJson = (await confirmRes.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!confirmRes.ok || !confirmJson?.ok) {
        setSubmitting(false);
        setError(
          confirmJson?.error ||
            'Account created, but email confirmation is on and no mail was sent. In Supabase: Authentication → Providers → Email → turn off Confirm email. Then sign in.'
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setSubmitting(false);
        setError(signInError.message);
        return;
      }
    }

    window.location.assign(routes.auth.onboarding);
  };

  return (
    <AuthShell
      title="Create account"
      kicker="Get started"
      subtitle="Set up your workspace and send your first invoice."
      imageSrc={timelyImages.lifestyle.businessOwner}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Name" htmlFor="fullName">
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11"
          />
        </Field>
        <Field label="Email" htmlFor="email">
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
        </Field>
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
        />

        {error ? (
          <div className="ti-error" role="alert">
            <div className="font-medium">Couldn&apos;t create account</div>
            <p className="ti-error-body">{error}</p>
          </div>
        ) : null}

        <Button type="submit" loading={submitting} className="h-11 w-full">
          Create account
        </Button>
      </form>

      <p className="ti-small mt-8 border-t border-[var(--tl-line)] pt-6 text-[var(--tl-ink-2)]">
        Already have an account?{' '}
        <Link href={routes.auth.login} className="font-medium text-[var(--tl-ink)] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
