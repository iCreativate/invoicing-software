'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ensureReferralCode, fetchMyReferralRewards, uploadCompanyLogo, type ReferralRewardRow } from '@/features/company/api';
import { companyLogoImgSrc } from '@/lib/company/logoUrl';
import { routes } from '@/lib/routing/routes';

function pickerHex(stored: string, fb: string) {
  const t = stored.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t}`;
  return fb;
}

export default function SettingsClient() {
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
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');
  const [preferredLocale, setPreferredLocale] = useState('en');
  const [baseCurrency, setBaseCurrency] = useState('ZAR');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [rewards, setRewards] = useState<ReferralRewardRow[]>([]);
  const [origin, setOrigin] = useState('');
  const [invoiceAccentHex, setInvoiceAccentHex] = useState('#2563eb');
  const [invoiceHeaderHex, setInvoiceHeaderHex] = useState('#0f172a');
  const [emailTemplateInvoice, setEmailTemplateInvoice] = useState('');
  const [emailTemplateReminder, setEmailTemplateReminder] = useState('');
  const [workspacePermission, setWorkspacePermission] = useState<string>('owner');
  const [canManageTeam, setCanManageTeam] = useState(true);
  const [canEditWorkspace, setCanEditWorkspace] = useState(true);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/settings', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'Failed to load settings.');
        }
        if (!alive) return;
        setWorkspacePermission(String(json.data?.workspace?.permission ?? 'owner'));
        setCanManageTeam(Boolean(json.data?.workspace?.canManageTeam));
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
          setSubscriptionPlan(p.subscriptionPlan ?? 'free');
          setPreferredLocale(p.preferredLocale ?? 'en');
          setBaseCurrency(p.baseCurrency ?? 'ZAR');
          setReferralCode(p.referralCode ?? null);
          setInvoiceAccentHex(p.invoiceAccentHex?.trim() || '#2563eb');
          setInvoiceHeaderHex(p.invoiceHeaderHex?.trim() || '#0f172a');
          setEmailTemplateInvoice(p.emailTemplateInvoice ?? '');
          setEmailTemplateReminder(p.emailTemplateReminder ?? '');
        }
        const code = await ensureReferralCode();
        if (alive && code) setReferralCode(code);
        if (alive) {
          try {
            const rw = await fetchMyReferralRewards();
            if (alive) setRewards(rw);
          } catch {
            if (alive) setRewards([]);
          }
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load settings.');
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
    } catch (e: any) {
      setError(
        e?.message ??
          'Failed to upload logo. Ensure a Supabase Storage bucket named "logos" exists.'
      );
    }
  };

  const onSave = async () => {
    setOk(null);
    setError(null);
    if (!canSave) {
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
          subscriptionPlan,
          preferredLocale,
          baseCurrency: baseCurrency.trim() || 'ZAR',
          invoiceAccentHex: invoiceAccentHex.trim() || null,
          invoiceHeaderHex: invoiceHeaderHex.trim() || null,
          emailTemplateInvoice: emailTemplateInvoice.trim() || null,
          emailTemplateReminder: emailTemplateReminder.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to save settings.');
      }
      setOk('Saved.');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings">
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Company profile</div>
              <div className="mt-1 text-sm text-muted-foreground">
                This info and logo will appear on your invoices.
              </div>
            </div>
            <div className="shrink-0">
              <Button onClick={onSave} disabled={loading || saving || !canSave || !canEditWorkspace}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div>
          ) : null}
          {ok ? (
            <div className="mt-4 rounded-2xl bg-success/10 p-3 text-sm text-success">{ok}</div>
          ) : null}
          {!canEditWorkspace ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
              View-only access: your role cannot change workspace settings.
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Company name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Studio (Pty) Ltd"
                  disabled={formDisabled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="accounts@…" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" disabled={formDisabled} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, ZIP" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">VAT number</label>
                <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="(optional)" disabled={formDisabled} />
              </div>
            </div>

            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-sm font-semibold">Logo</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Upload a square or wide PNG/SVG.
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/5 grid place-items-center dark:bg-white/10 dark:ring-white/10">
                  {logoUrl ? (
                    !logoSrc ? (
                      <div className="px-1 text-center text-[10px] leading-tight font-medium text-muted-foreground">
                        Invalid logo path — re-upload and save
                      </div>
                    ) : logoPreviewFailed ? (
                      <div className="px-1 text-center text-[10px] leading-tight font-medium text-muted-foreground">
                        Preview unavailable (try PNG or JPG)
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoSrc}
                        alt="Company logo"
                        className="h-full w-full object-contain"
                        onLoad={() => setLogoPreviewFailed(false)}
                        onError={() => setLogoPreviewFailed(true)}
                      />
                    )
                  ) : (
                    <div className="text-xs font-semibold text-muted-foreground">No logo</div>
                  )}
                </div>
                <div className="min-w-0">
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="secondary" disabled={formDisabled} onClick={() => document.getElementById('logo-upload')?.click()}>
                      Upload logo
                    </Button>
                    {logoUrl ? (
                      <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {logoUrl.split('/').slice(-1)[0]}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP</div>
                    )}
                  </div>
                </div>
              </div>
              {logoUrl ? (
                <div className="mt-3">
                  <Button type="button" variant="secondary" onClick={() => setLogoUrl(null)} disabled={formDisabled}>
                    Remove logo
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-muted/20 p-4">
            <div className="text-sm font-semibold">Banking details</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Shown on invoices so clients can pay by EFT.
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank name</label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. FNB" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account name</label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Acme Studio (Pty) Ltd" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account number</label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Branch code</label>
                <Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="e.g. 250655" disabled={formDisabled} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Account type</label>
                <Input value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="e.g. Cheque" disabled={formDisabled} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold">Invoice branding</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Accent and header colors for future PDF / shared invoice themes (stored per workspace).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Accent color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-11 w-14 cursor-pointer rounded-lg border border-input bg-background p-1"
                  value={pickerHex(invoiceAccentHex, '#2563eb')}
                  onChange={(e) => setInvoiceAccentHex(e.target.value)}
                  disabled={formDisabled}
                />
                <Input
                  value={invoiceAccentHex}
                  onChange={(e) => setInvoiceAccentHex(e.target.value)}
                  placeholder="#2563eb"
                  disabled={formDisabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Header / text color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-11 w-14 cursor-pointer rounded-lg border border-input bg-background p-1"
                  value={pickerHex(invoiceHeaderHex, '#0f172a')}
                  onChange={(e) => setInvoiceHeaderHex(e.target.value)}
                  disabled={formDisabled}
                />
                <Input
                  value={invoiceHeaderHex}
                  onChange={(e) => setInvoiceHeaderHex(e.target.value)}
                  placeholder="#0f172a"
                  disabled={formDisabled}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold">Email templates</div>
          <p className="mt-1 text-sm text-muted-foreground">
            HTML or plain text. Placeholders:{' '}
            <code className="text-xs">{'{{invoice_number}}'}</code>,{' '}
            <code className="text-xs">{'{{share_url}}'}</code>,{' '}
            <code className="text-xs">{'{{company_name}}'}</code>,{' '}
            <code className="text-xs">{'{{total_amount}}'}</code>,{' '}
            <code className="text-xs">{'{{due_date}}'}</code>,{' '}
            <code className="text-xs">{'{{balance}}'}</code> (reminders:{' '}
            <code className="text-xs">{'{{client_name}}'}</code>).
          </p>
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice email body</label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={emailTemplateInvoice}
                onChange={(e) => setEmailTemplateInvoice(e.target.value)}
                placeholder={`<p>Invoice {{invoice_number}} from {{company_name}} is ready.</p><p><a href="{{share_url}}">View invoice</a></p>`}
                disabled={formDisabled}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reminder email body</label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={emailTemplateReminder}
                onChange={(e) => setEmailTemplateReminder(e.target.value)}
                placeholder={`<p>Reminder: invoice {{invoice_number}} (balance {{balance}}).</p><p><a href="{{share_url}}">Pay now</a></p>`}
                disabled={formDisabled}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold">Roles &amp; permissions</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your access level: <span className="font-semibold text-foreground capitalize">{workspacePermission}</span>
            {canManageTeam ? ' · You can invite and manage team permissions.' : null}
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Owner / Admin</span> — manage team, invitations, and full edit
              access.
            </li>
            <li>
              <span className="font-semibold text-foreground">Billing</span> — record payments, gateways, mark paid; also edits
              like other editors unless you restrict further later.
            </li>
            <li>
              <span className="font-semibold text-foreground">Staff (member)</span> — create and edit invoices, clients, quotes,
              etc.
            </li>
            <li>
              <span className="font-semibold text-foreground">Viewer</span> — read-only in the app (UI enforcement is expanding).
            </li>
          </ul>
          <div className="mt-4">
            <Button asChild variant="secondary">
              <Link href={routes.app.employees}>Manage team</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-5 motion-safe:animate-[ti-fade-up_0.4s_ease-out_both]">
          <div className="text-sm font-semibold">Plan &amp; localization</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Free plans show a small “Powered by TimelyInvoices” line on shared invoices. Upgraded plans remove it.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subscription plan</label>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={subscriptionPlan}
                onChange={(e) => setSubscriptionPlan(e.target.value)}
                disabled={formDisabled}
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred locale (i18n ready)</label>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={preferredLocale}
                onChange={(e) => setPreferredLocale(e.target.value)}
                disabled={formDisabled}
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">Zulu (coming)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base currency</label>
              <Input
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
                placeholder="ZAR"
                disabled={formDisabled}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 motion-safe:animate-[ti-fade-up_0.45s_ease-out_both]">
          <div className="text-sm font-semibold">Referrals</div>
          <p className="mt-1 text-sm text-muted-foreground break-all">
            Share your link:{' '}
            <span className="font-medium text-foreground">
              {origin}
              {routes.auth.register}?ref={referralCode ?? '…'}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!referralCode}
              onClick={() => {
                if (!referralCode) return;
                const url = `${window.location.origin}${routes.auth.register}?ref=${encodeURIComponent(referralCode)}`;
                void navigator.clipboard.writeText(url);
                setOk('Referral link copied.');
              }}
            >
              Copy link
            </Button>
          </div>
          {rewards.length ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted-foreground">Reward history</div>
              <ul className="mt-2 space-y-2 text-sm">
                {rewards.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2 rounded-xl bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">{r.reason}</span>
                    <span className="font-semibold tabular-nums">
                      {r.amount} {r.currency}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

