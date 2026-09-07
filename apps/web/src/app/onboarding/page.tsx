'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';

const STEPS = [
  { id: 1, title: 'Your business', subtitle: 'Shown on invoices and quotes.' },
  { id: 2, title: 'Logo', subtitle: 'Optional — you can add this later.' },
  { id: 3, title: 'VAT', subtitle: 'Optional if you are not VAT registered.' },
  { id: 4, title: 'Bank details', subtitle: 'Printed on invoices so clients know where to pay.' },
  { id: 5, title: 'You’re ready', subtitle: 'Create your first invoice when you are.' },
] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    logoUrl: '',
    vatNumber: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'cheque',
  });

  const current = STEPS[step - 1];

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          logoUrl: form.logoUrl.trim() || null,
          vatNumber: form.vatNumber.trim() || null,
          bankName: form.bankName.trim() || null,
          accountName: form.accountName.trim() || null,
          accountNumber: form.accountNumber.trim() || null,
          branchCode: form.branchCode.trim() || null,
          accountType: form.accountType.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Could not save');
      setSaved(true);
      setStep(5);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title={current.title} subtitle={current.subtitle}>
      <p className="ti-caption mb-6">
        {step} of {STEPS.length}
      </p>

      {step === 1 ? (
        <div className="space-y-5">
          <Field label="Business name" htmlFor="companyName">
            <Input
              id="companyName"
              className="h-11"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              autoComplete="organization"
              autoFocus
            />
          </Field>
          <Button
            type="button"
            className="h-11 w-full"
            disabled={form.companyName.trim().length < 2}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
          <p className="text-center text-sm text-[var(--tl-ink-2)]">
            <Link href={routes.app.dashboard} className="underline-offset-4 hover:text-[var(--tl-ink)] hover:underline">
              I’ll do this later
            </Link>
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <Field label="Logo URL" htmlFor="logoUrl" hint="Optional">
            <Input
              id="logoUrl"
              className="h-11"
              value={form.logoUrl}
              onChange={(e) => update('logoUrl', e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Button type="button" className="h-11 w-full" onClick={() => setStep(3)}>
            Continue
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => setStep(1)}>
            Back
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <Field label="VAT number" htmlFor="vatNumber" hint="Optional">
            <Input
              id="vatNumber"
              className="h-11"
              value={form.vatNumber}
              onChange={(e) => update('vatNumber', e.target.value)}
            />
          </Field>
          <Button type="button" className="h-11 w-full" onClick={() => setStep(4)}>
            Continue
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => setStep(2)}>
            Back
          </Button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-5">
          <Field label="Bank name" htmlFor="bankName">
            <Input id="bankName" className="h-11" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
          </Field>
          <Field label="Account name" htmlFor="accountName">
            <Input
              id="accountName"
              className="h-11"
              value={form.accountName}
              onChange={(e) => update('accountName', e.target.value)}
            />
          </Field>
          <Field label="Account number" htmlFor="accountNumber">
            <Input
              id="accountNumber"
              className="h-11"
              value={form.accountNumber}
              onChange={(e) => update('accountNumber', e.target.value)}
            />
          </Field>
          <Field label="Branch code" htmlFor="branchCode">
            <Input
              id="branchCode"
              className="h-11"
              value={form.branchCode}
              onChange={(e) => update('branchCode', e.target.value)}
            />
          </Field>
          {error ? (
            <div className="ti-error" role="alert">
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}
          <Button
            type="button"
            className="h-11 w-full"
            loading={saving}
            disabled={form.companyName.trim().length < 2}
            onClick={() => void saveProfile()}
          >
            Save profile
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" disabled={saving} onClick={() => setStep(3)}>
            Back
          </Button>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-[var(--tl-ink-2)]" role="status">
            {saved ? 'Your company profile is saved.' : 'Your workspace is ready.'} Create an invoice when you want to
            get paid.
          </p>
          <Button asChild className="h-11 w-full">
            <Link href={`${routes.app.invoices}/new`}>Create invoice</Link>
          </Button>
          <p className="text-center text-sm text-[var(--tl-ink-2)]">
            <Link href={routes.app.dashboard} className="underline-offset-4 hover:text-[var(--tl-ink)] hover:underline">
              Go to dashboard
            </Link>
          </p>
        </div>
      ) : null}
    </AuthShell>
  );
}
