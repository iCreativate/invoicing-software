'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

const STEPS = [
  { id: 1, title: 'Business name' },
  { id: 2, title: 'Logo' },
  { id: 3, title: 'VAT' },
  { id: 4, title: 'Bank details' },
  { id: 5, title: 'Create invoice' },
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
    } catch (e: any) {
      setError(e?.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Onboarding">
      <PageBody>
        <PageHeader title="Set up your workspace" description="Five quick steps so invoices look ready for South African clients." />

        <ol className="mb-4 flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <li
              key={s.id}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs',
                step === s.id ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'
              )}
            >
              {s.id}. {s.title}
            </li>
          ))}
        </ol>

        <GlassCard className="space-y-4 p-5">
          {step === 1 ? (
            <>
              <label className="block text-sm">
                <span className="text-muted-foreground">Business name</span>
                <Input
                  className="mt-1"
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  placeholder="Acme Trading (Pty) Ltd"
                />
              </label>
              <Button type="button" disabled={form.companyName.trim().length < 2} onClick={() => setStep(2)}>
                Continue
              </Button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="block text-sm">
                <span className="text-muted-foreground">Logo URL (optional)</span>
                <Input
                  className="mt-1"
                  value={form.logoUrl}
                  onChange={(e) => update('logoUrl', e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <label className="block text-sm">
                <span className="text-muted-foreground">VAT number (optional)</span>
                <Input
                  className="mt-1"
                  value={form.vatNumber}
                  onChange={(e) => update('vatNumber', e.target.value)}
                  placeholder="4xxxxxxxxx"
                />
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(4)}>
                  Continue
                </Button>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Bank name</span>
                  <Input className="mt-1" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Account name</span>
                  <Input className="mt-1" value={form.accountName} onChange={(e) => update('accountName', e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Account number</span>
                  <Input className="mt-1" value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Branch code</span>
                  <Input className="mt-1" value={form.branchCode} onChange={(e) => update('branchCode', e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Account type</span>
                  <Input className="mt-1" value={form.accountType} onChange={(e) => update('accountType', e.target.value)} />
                </label>
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="button" disabled={saving || form.companyName.trim().length < 2} onClick={() => void saveProfile()}>
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {saved ? 'Your company profile is saved.' : 'Profile ready.'} Create your first invoice to start collecting.
              </p>
              <Button asChild>
                <Link href={`${routes.app.invoices}/new`}>Create invoice</Link>
              </Button>
            </>
          ) : null}
        </GlassCard>
      </PageBody>
    </AppShell>
  );
}
