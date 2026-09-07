'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { searchClients } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import {
  clientFormSchema,
  EMPTY_CLIENT_FORM,
  formCompletion,
  normalizeClientPayload,
  type ClientFormValues,
  type ClientKind,
} from '@/lib/clients/form';
import { routes } from '@/lib/routing/routes';
import { ClientFormTips, ClientPreviewCard } from '@/components/clients/ClientPreviewCard';

export function ClientForm({
  initialValues = EMPTY_CLIENT_FORM,
  initialKind = 'business',
  submitting = false,
  error,
  disabled = false,
  submitLabel = 'Create client',
  showSecondaryAction = false,
  onSubmit,
  onCancel,
}: {
  initialValues?: ClientFormValues;
  initialKind?: ClientKind;
  submitting?: boolean;
  error?: string | null;
  disabled?: boolean;
  submitLabel?: string;
  showSecondaryAction?: boolean;
  onSubmit: (payload: ReturnType<typeof normalizeClientPayload>, action: 'save' | 'invoice') => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<ClientKind>(initialKind);
  const [form, setForm] = useState<ClientFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<ClientListItem[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const completion = useMemo(() => formCompletion(form), [form]);
  const canSubmit = form.name.trim().length > 0 && !submitting && !disabled;

  useEffect(() => {
    const email = form.email.trim();
    const name = form.name.trim();
    const company = (form.companyName ?? '').trim();
    const needle = email || company || name;
    if (needle.length < 3) {
      setDuplicates([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setCheckingDuplicates(true);
        const results = await searchClients(needle);
        const emailLower = email.toLowerCase();
        const nameLower = name.toLowerCase();
        const companyLower = company.toLowerCase();
        const matches = results.filter((c) => {
          if (email && c.email?.toLowerCase() === emailLower) return true;
          if (name && c.name.toLowerCase() === nameLower) return true;
          if (company && (c.companyName ?? '').toLowerCase() === companyLower) return true;
          return false;
        });
        setDuplicates(matches.slice(0, 3));
      } catch {
        setDuplicates([]);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.email, form.name, form.companyName]);

  const validate = () => {
    const parsed = clientFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path.join('.')] = issue.message;
      }
      setErrors(next);
      return null;
    }
    setErrors({});
    return normalizeClientPayload(parsed.data);
  };

  const handleSubmit = async (action: 'save' | 'invoice') => {
    const payload = validate();
    if (!payload) return;
    await onSubmit(payload, action);
  };

  const set = <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:gap-5">
      <div className="grid gap-4 lg:gap-5">
        <AdminPanel
          kicker="Client type"
          title={kind === 'business' ? 'Business client' : 'Individual client'}
          description="Choose how you bill this relationship. You can change details anytime."
          bodyClassName="mt-5"
        >
          <Tabs
            items={[
              { value: 'business', label: 'Business' },
              { value: 'individual', label: 'Individual' },
            ]}
            value={kind}
            onChange={(v) => setKind(v as ClientKind)}
          />
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--tl-ink-3)]">
            {kind === 'business'
              ? 'Company name appears on invoices. Add a contact person for reminders and approvals.'
              : 'Person’s name is the billing identity. Company fields stay optional.'}
          </p>
        </AdminPanel>

        <AdminPanel
          kicker="Contact"
          title="Primary details"
          description="Used for invoices, quotes, and payment follow-ups."
          bodyClassName="mt-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {kind === 'business' ? (
              <Field
                className="sm:col-span-2"
                label="Company / trading name"
                htmlFor="client-company"
                error={errors.companyName}
                hint="Legal or trading name on tax invoices."
              >
                <Input
                  id="client-company"
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder="e.g. Acme (Pty) Ltd"
                  disabled={disabled}
                  autoFocus
                />
              </Field>
            ) : null}

            <Field
              className={kind === 'business' ? 'sm:col-span-2' : 'sm:col-span-2'}
              label={kind === 'business' ? 'Contact person' : 'Full name'}
              htmlFor="client-name"
              error={errors.name}
            >
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder={kind === 'business' ? 'e.g. Jane Smith' : 'e.g. Jane Smith'}
                disabled={disabled}
                autoFocus={kind === 'individual'}
                required
              />
            </Field>

            <Field label="Email" htmlFor="client-email" error={errors.email} hint="For sending invoices and reminders.">
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="name@company.co.za"
                disabled={disabled}
                autoComplete="email"
              />
            </Field>

            <Field label="Phone" htmlFor="client-phone" hint="Optional — helpful for WhatsApp reminders.">
              <Input
                id="client-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+27 82 123 4567"
                disabled={disabled}
                autoComplete="tel"
              />
            </Field>
          </div>
        </AdminPanel>

        <AdminPanel
          kicker="Tax & registration"
          title="Company records"
          description="Optional — adds professionalism to VAT invoices."
          bodyClassName="mt-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration / CK number" htmlFor="client-reg">
              <Input
                id="client-reg"
                value={form.companyRegistration}
                onChange={(e) => set('companyRegistration', e.target.value)}
                placeholder="e.g. 2021/123456/07"
                disabled={disabled}
              />
            </Field>
            <Field label="VAT number" htmlFor="client-vat" hint="10-digit SA VAT number when registered.">
              <Input
                id="client-vat"
                value={form.vatNumber}
                onChange={(e) => set('vatNumber', e.target.value)}
                placeholder="e.g. 4123456789"
                disabled={disabled}
              />
            </Field>
            <Field className="sm:col-span-2" label="Website" htmlFor="client-website" error={errors.website}>
              <Input
                id="client-website"
                type="url"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://example.co.za"
                disabled={disabled}
              />
            </Field>
          </div>
        </AdminPanel>

        <AdminPanel
          kicker="Billing"
          title="Postal address"
          description="Printed on invoices when you include a client address block."
          bodyClassName="mt-5"
        >
          <Field label="Address" htmlFor="client-address" hint="Street, suburb, city, and postal code.">
            <Textarea
              id="client-address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder={'12 Main Road\nSandton, 2196'}
              rows={3}
              disabled={disabled}
            />
          </Field>
        </AdminPanel>

        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tl-line)] pt-4">
          <p className="ti-caption text-[var(--tl-ink-3)]">
            {completion.filled} of {completion.total} fields completed
            {checkingDuplicates ? ' · Checking for duplicates…' : null}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {onCancel ? (
              <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            ) : null}
            {showSecondaryAction ? (
              <Button
                type="button"
                variant="secondary"
                disabled={!canSubmit}
                loading={submitting}
                onClick={() => void handleSubmit('invoice')}
              >
                Create &amp; invoice
              </Button>
            ) : null}
            <Button type="button" disabled={!canSubmit} loading={submitting} onClick={() => void handleSubmit('save')}>
              {submitting ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <ClientPreviewCard values={form} kind={kind} />

        {duplicates.length > 0 ? (
          <AdminAlertBanner tone="warning">
            <p className="font-medium">Similar client{duplicates.length === 1 ? '' : 's'} already exist</p>
            <ul className="mt-2 space-y-1.5">
              {duplicates.map((c) => (
                <li key={c.id}>
                  <Link href={`${routes.app.clients}/${c.id}`} className="font-medium hover:underline">
                    {c.companyName ? `${c.companyName} · ${c.name}` : c.name}
                  </Link>
                  {c.email ? <span className="text-[var(--tl-ink-3)]"> — {c.email}</span> : null}
                </li>
              ))}
            </ul>
          </AdminAlertBanner>
        ) : null}

        <AdminPanel kicker="Tips" title="Getting started" bodyClassName="mt-5">
          <ClientFormTips />
        </AdminPanel>
      </div>
    </div>
  );
}
