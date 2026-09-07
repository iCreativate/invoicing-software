'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Building2, ImageIcon, Upload } from 'lucide-react';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { uploadCompanyLogo } from '@/features/company/api';
import { companyLogoImgSrc } from '@/lib/company/logoUrl';
import { notifyError, notifySuccess } from '@/lib/notify';
import { AdminAlertBanner } from '@/components/settings/admin-ui';
import { cn } from '@/lib/utils/cn';

function pickerHex(stored: string, fb: string) {
  const t = stored.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t}`;
  return fb;
}

export type CompanyProfileActions = {
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
};

type Props = {
  /** Lift save button into SettingsWorkspace hero actions */
  onRegisterActions?: (actions: CompanyProfileActions | null) => void;
};

function CompanyPreviewStrip({
  companyName,
  logoSrc,
  logoPreviewFailed,
  accentHex,
  headerHex,
}: {
  companyName: string;
  logoSrc: string | null;
  logoPreviewFailed: boolean;
  accentHex: string;
  headerHex: string;
}) {
  const name = companyName.trim() || 'Your company';
  return (
    <div
      className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] shadow-[var(--shadow-elevated)]"
      aria-hidden
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: pickerHex(accentHex, '#2F6F7E') }} />
      <div className="flex items-center gap-3 bg-white px-4 py-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--tl-bg)] ring-1 ring-[var(--tl-line)]">
          {logoSrc && !logoPreviewFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 className="h-4 w-4 text-[var(--tl-ink-3)]" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold" style={{ color: pickerHex(headerHex, '#0f172a') }}>
            {name}
          </div>
          <div className="ti-caption mt-0.5">How clients see you on invoices</div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyProfileClient({ onRegisterActions }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('');
  const [invoiceAccentHex, setInvoiceAccentHex] = useState('#2F6F7E');
  const [invoiceHeaderHex, setInvoiceHeaderHex] = useState('#0f172a');
  const [emailTemplateInvoice, setEmailTemplateInvoice] = useState('');
  const [emailTemplateReminder, setEmailTemplateReminder] = useState('');
  const [canEditWorkspace, setCanEditWorkspace] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/settings', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'Failed to load company profile.');
        }
        if (!alive) return;
        setCanEditWorkspace(json.data?.workspace?.canEdit !== false);
        const p = json.data?.company;
        if (p) {
          setCompanyName(p.companyName ?? '');
          setEmail(p.email ?? '');
          setPhone(p.phone ?? '');
          setAddress(p.address ?? '');
          setWebsite(p.website ?? '');
          setVatNumber(p.vatNumber ?? '');
          setLogoUrl(p.logoUrl ?? null);
          setBankName(p.bankName ?? '');
          setAccountName(p.accountName ?? '');
          setAccountNumber(p.accountNumber ?? '');
          setBranchCode(p.branchCode ?? '');
          setAccountType(p.accountType ?? '');
          setInvoiceAccentHex(p.invoiceAccentHex?.trim() || '#2F6F7E');
          setInvoiceHeaderHex(p.invoiceHeaderHex?.trim() || '#0f172a');
          setEmailTemplateInvoice(p.emailTemplateInvoice ?? '');
          setEmailTemplateReminder(p.emailTemplateReminder ?? '');
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load company profile.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [logoUrl]);

  const logoSrc = useMemo(() => (logoUrl ? companyLogoImgSrc(logoUrl) : null), [logoUrl]);
  const canSave = useMemo(() => companyName.trim().length > 1, [companyName]);
  const formDisabled = loading || !canEditWorkspace;

  const onUpload = async (file: File) => {
    if (!canEditWorkspace) return;
    setOk(null);
    setError(null);
    try {
      const path = await uploadCompanyLogo(file);
      setLogoUrl(path);
      setOk('Logo uploaded.');
      notifySuccess('Logo uploaded.');
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to upload logo. Ensure a Supabase Storage bucket named "logos" exists.';
      setError(msg);
      notifyError(msg);
    }
  };

  const onSave = useCallback(async () => {
    setOk(null);
    setError(null);
    if (companyName.trim().length <= 1) {
      setError('Company name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          website: website.trim() || null,
          vatNumber: vatNumber.trim() || null,
          logoUrl,
          bankName: bankName.trim() || null,
          accountName: accountName.trim() || null,
          accountNumber: accountNumber.trim() || null,
          branchCode: branchCode.trim() || null,
          accountType: accountType.trim() || null,
          invoiceAccentHex: invoiceAccentHex.trim() || null,
          invoiceHeaderHex: invoiceHeaderHex.trim() || null,
          emailTemplateInvoice: emailTemplateInvoice.trim() || null,
          emailTemplateReminder: emailTemplateReminder.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to save company profile.');
      }
      setOk('Saved.');
      notifySuccess('Company profile saved.');
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to save company profile.';
      setError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    companyName,
    email,
    phone,
    address,
    website,
    vatNumber,
    logoUrl,
    bankName,
    accountName,
    accountNumber,
    branchCode,
    accountType,
    invoiceAccentHex,
    invoiceHeaderHex,
    emailTemplateInvoice,
    emailTemplateReminder,
  ]);

  useEffect(() => {
    if (!onRegisterActions) return;
    onRegisterActions({
      onSave: () => void onSave(),
      saving,
      disabled: loading || saving || !canSave || !canEditWorkspace,
    });
    return () => onRegisterActions(null);
  }, [onRegisterActions, onSave, saving, loading, canSave, canEditWorkspace]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-5" aria-busy>
        <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
        <Surface variant="elevated" className="p-5 sm:p-6">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </Surface>
        <Surface variant="elevated" className="p-5 sm:p-6">
          <Skeleton className="h-4 w-28" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 md:gap-5">
      {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
      {ok ? <AdminAlertBanner tone="success">{ok}</AdminAlertBanner> : null}
      {!canEditWorkspace ? (
        <AdminAlertBanner tone="warning">View-only access — your role cannot change the company profile.</AdminAlertBanner>
      ) : null}

      <CompanyPreviewStrip
        companyName={companyName}
        logoSrc={logoSrc}
        logoPreviewFailed={logoPreviewFailed}
        accentHex={invoiceAccentHex}
        headerHex={invoiceHeaderHex}
      />

      <Surface variant="elevated" className="p-5 sm:p-6">
        <SectionHeader
          kicker="Company details"
          description="Legal and contact information printed on every invoice."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="company-name" className="sm:col-span-2">
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Studio (Pty) Ltd"
                disabled={formDisabled}
              />
            </Field>
            <Field label="Email" htmlFor="company-email">
              <Input
                id="company-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accounts@…"
                disabled={formDisabled}
              />
            </Field>
            <Field label="Phone" htmlFor="company-phone">
              <Input
                id="company-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 …"
                disabled={formDisabled}
              />
            </Field>
            <Field label="Address" htmlFor="company-address" className="sm:col-span-2">
              <Input
                id="company-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, postal code"
                disabled={formDisabled}
              />
            </Field>
            <Field label="Website" htmlFor="company-website">
              <Input
                id="company-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
                disabled={formDisabled}
              />
            </Field>
            <Field label="VAT number" htmlFor="company-vat" hint="Optional — shown when registered for VAT.">
              <Input
                id="company-vat"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="4123456789"
                disabled={formDisabled}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[var(--tl-ink-2)]">
              <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="ti-caption font-semibold uppercase tracking-wider">Logo</span>
            </div>
            <div className="flex flex-1 flex-col rounded-[var(--tl-radius-sm)] border border-dashed border-[var(--tl-line-strong)] bg-[var(--tl-bg)] p-4">
              <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-xl bg-white shadow-[var(--shadow-elevated)] ring-1 ring-[var(--tl-line)]">
                {logoUrl ? (
                  !logoSrc ? (
                    <span className="px-2 text-center text-[10px] leading-tight text-[var(--tl-ink-3)]">
                      Invalid path — re-upload
                    </span>
                  ) : logoPreviewFailed ? (
                    <span className="px-2 text-center text-[10px] leading-tight text-[var(--tl-ink-3)]">
                      Preview unavailable
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoSrc}
                      alt="Company logo"
                      className="h-full w-full object-contain p-2"
                      onLoad={() => setLogoPreviewFailed(false)}
                      onError={() => setLogoPreviewFailed(true)}
                    />
                  )
                ) : (
                  <Upload className="h-5 w-5 text-[var(--tl-ink-3)]" aria-hidden />
                )}
              </div>
              <p className="mt-3 text-center ti-caption text-[var(--tl-ink-3)]">PNG, JPG, SVG or WebP</p>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                  e.currentTarget.value = '';
                }}
                disabled={formDisabled}
              />
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={formDisabled}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  Upload logo
                </Button>
                {logoUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setLogoUrl(null)}
                    disabled={formDisabled}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <Surface variant="elevated" className="p-5 sm:p-6">
        <SectionHeader
          kicker="Banking"
          description="EFT details clients use to pay your invoices."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" htmlFor="bank-name">
            <Input
              id="bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. FNB"
              disabled={formDisabled}
            />
          </Field>
          <Field label="Account name" htmlFor="account-name">
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Registered account holder"
              disabled={formDisabled}
            />
          </Field>
          <Field label="Account number" htmlFor="account-number">
            <Input
              id="account-number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="1234567890"
              disabled={formDisabled}
              className="tabular-nums"
            />
          </Field>
          <Field label="Branch code" htmlFor="branch-code">
            <Input
              id="branch-code"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              placeholder="250655"
              disabled={formDisabled}
              className="tabular-nums"
            />
          </Field>
          <Field label="Account type" htmlFor="account-type" className="sm:col-span-2">
            <Input
              id="account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              placeholder="Cheque / Savings"
              disabled={formDisabled}
            />
          </Field>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface variant="elevated" className="p-5 sm:p-6">
          <SectionHeader
            kicker="Invoice branding"
            description="Accent and header colours for PDF and shared invoices."
          />
          <div className="mt-6 space-y-4">
            <Field label="Accent colour" htmlFor="accent-hex">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accent-color"
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white p-1"
                  value={pickerHex(invoiceAccentHex, '#2F6F7E')}
                  onChange={(e) => setInvoiceAccentHex(e.target.value)}
                  disabled={formDisabled}
                  aria-label="Accent colour picker"
                />
                <Input
                  id="accent-hex"
                  value={invoiceAccentHex}
                  onChange={(e) => setInvoiceAccentHex(e.target.value)}
                  placeholder="#2F6F7E"
                  disabled={formDisabled}
                  className="font-mono text-sm"
                />
              </div>
            </Field>
            <Field label="Header / text colour" htmlFor="header-hex">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white p-1"
                  value={pickerHex(invoiceHeaderHex, '#0f172a')}
                  onChange={(e) => setInvoiceHeaderHex(e.target.value)}
                  disabled={formDisabled}
                  aria-label="Header colour picker"
                />
                <Input
                  id="header-hex"
                  value={invoiceHeaderHex}
                  onChange={(e) => setInvoiceHeaderHex(e.target.value)}
                  placeholder="#0f172a"
                  disabled={formDisabled}
                  className="font-mono text-sm"
                />
              </div>
            </Field>
            <div className="flex gap-2 pt-1">
              <div
                className="h-10 flex-1 rounded-[var(--tl-radius-sm)] ring-1 ring-[var(--tl-line)]"
                style={{ backgroundColor: pickerHex(invoiceAccentHex, '#2F6F7E') }}
                title="Accent preview"
              />
              <div
                className="flex h-10 flex-1 items-center justify-center rounded-[var(--tl-radius-sm)] text-xs font-semibold text-white ring-1 ring-[var(--tl-line)]"
                style={{ backgroundColor: pickerHex(invoiceHeaderHex, '#0f172a') }}
                title="Header preview"
              >
                Aa
              </div>
            </div>
          </div>
        </Surface>

        <Surface variant="elevated" className="p-5 sm:p-6">
          <SectionHeader
            kicker="Email templates"
            description="Optional HTML bodies for invoice and reminder emails."
          />
          <p className="mt-3 ti-caption leading-relaxed text-[var(--tl-ink-3)]">
            Placeholders:{' '}
            <code className="rounded bg-[var(--tl-bg)] px-1 py-0.5 font-mono text-[11px]">{'{{invoice_number}}'}</code>,{' '}
            <code className="rounded bg-[var(--tl-bg)] px-1 py-0.5 font-mono text-[11px]">{'{{share_url}}'}</code>,{' '}
            <code className="rounded bg-[var(--tl-bg)] px-1 py-0.5 font-mono text-[11px]">{'{{company_name}}'}</code>,{' '}
            <code className="rounded bg-[var(--tl-bg)] px-1 py-0.5 font-mono text-[11px]">{'{{balance}}'}</code>
          </p>
          <div className="mt-5 space-y-4">
            <Field label="Invoice email body" htmlFor="email-invoice">
              <Textarea
                id="email-invoice"
                rows={4}
                value={emailTemplateInvoice}
                onChange={(e) => setEmailTemplateInvoice(e.target.value)}
                placeholder={`<p>Invoice {{invoice_number}} from {{company_name}} is ready.</p>`}
                disabled={formDisabled}
                className="min-h-[7rem] resize-y font-mono text-[13px]"
              />
            </Field>
            <Field label="Reminder email body" htmlFor="email-reminder">
              <Textarea
                id="email-reminder"
                rows={4}
                value={emailTemplateReminder}
                onChange={(e) => setEmailTemplateReminder(e.target.value)}
                placeholder={`<p>Reminder: invoice {{invoice_number}} — balance {{balance}}.</p>`}
                disabled={formDisabled}
                className="min-h-[7rem] resize-y font-mono text-[13px]"
              />
            </Field>
          </div>
        </Surface>
      </div>

      {!onRegisterActions ? (
        <footer className="flex justify-end border-t border-[var(--tl-line)] pt-4">
          <Button onClick={onSave} disabled={loading || saving || !canSave || !canEditWorkspace} loading={saving}>
            Save workspace
          </Button>
        </footer>
      ) : null}
    </div>
  );
}
