'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  ensureReferralCode,
  fetchMyCompanyProfile,
  fetchMyReferralRewards,
  upsertMyCompanyProfile,
  uploadCompanyLogo,
  type ReferralRewardRow,
} from '@/features/company/api';
import { routes } from '@/lib/routing/routes';

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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const p = await fetchMyCompanyProfile();
        if (!alive) return;
        if (p) {
          setCompanyName(p.companyName);
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

  const canSave = useMemo(() => companyName.trim().length > 1, [companyName]);

  const onUpload = async (file: File) => {
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
      await upsertMyCompanyProfile({
        companyName: companyName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        vatNumber: vatNumber.trim() || undefined,
        logoUrl,
        bankName: bankName.trim() || undefined,
        accountName: accountName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        branchCode: branchCode.trim() || undefined,
        accountType: accountType.trim() || undefined,
        subscriptionPlan: subscriptionPlan || undefined,
        preferredLocale: preferredLocale || undefined,
        baseCurrency: baseCurrency || undefined,
      });
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
              <Button onClick={onSave} disabled={loading || saving || !canSave}>
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

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Company name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Studio (Pty) Ltd"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="accounts@…" disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" disabled={loading} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, ZIP" disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">VAT number</label>
                <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="(optional)" disabled={loading} />
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/storage/logo?path=${encodeURIComponent(logoUrl)}`}
                      alt="Company logo"
                      className="h-full w-full object-contain"
                    />
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
                    disabled={loading}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="secondary" disabled={loading} onClick={() => document.getElementById('logo-upload')?.click()}>
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
                  <Button type="button" variant="secondary" onClick={() => setLogoUrl(null)} disabled={loading}>
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
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. FNB" disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account name</label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Acme Studio (Pty) Ltd" disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account number</label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Branch code</label>
                <Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="e.g. 250655" disabled={loading} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Account type</label>
                <Input value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="e.g. Cheque" disabled={loading} />
              </div>
            </div>
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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

