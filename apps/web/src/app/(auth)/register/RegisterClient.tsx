'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, User } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { routes } from '@/lib/routing/routes';
import { AuthShell } from '@/components/auth/AuthShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterClient() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);

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
    if (companyName.trim()) data.company_name = companyName.trim();
    if (companyPhone.trim()) data.company_phone = companyPhone.trim();
    if (companyWebsite.trim()) data.company_website = companyWebsite.trim().replace(/^\/+/, '');
    if (ref) data.referrer_code = ref;

    const supabase = createSupabaseBrowserClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}${routes.app.dashboard}`,
        data,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess('Account created. Check your email if confirmation is required, then sign in. Your profile details will apply when you first open the app.');
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Set up your account in a minute. Company details are optional and can be edited anytime in Settings."
    >
      <Card className="border-border/80 bg-card/80 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both] sm:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
              <User className="h-4 w-4" aria-hidden />
            </span>
            Your details
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="fullName">
                Full name <span className="font-normal text-muted-foreground">(required)</span>
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Thabo Mthembu"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Work email
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
              <label className="text-sm font-medium" htmlFor="password">
                Password
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
              <p className="text-xs text-muted-foreground">At least 8 characters. Use a unique password you do not reuse elsewhere.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Optional</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-4 w-4" aria-hidden />
              </span>
              Company / trading as
            </div>
            <p className="-mt-1 text-xs text-muted-foreground">
              Shown on invoices and quotes. Skip for now if you are still deciding on a name.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="companyName">
                Company or brand name
              </label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Consulting (Pty) Ltd"
                className="h-11"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="companyPhone">
                  Business phone
                </label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  type="tel"
                  autoComplete="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+27 …"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="companyWebsite">
                  Website
                </label>
                <Input
                  id="companyWebsite"
                  name="companyWebsite"
                  type="url"
                  autoComplete="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://…"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger" role="alert">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success" role="status">
              {success}
            </div>
          ) : null}

          <Button type="submit" disabled={submitting} className="h-12 w-full text-base shadow-[var(--shadow-md)]">
            {submitting ? 'Creating workspace…' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={routes.auth.login} className="font-semibold text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
