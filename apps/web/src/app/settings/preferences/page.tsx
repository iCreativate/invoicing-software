'use client';

import { useEffect, useState } from 'react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/settings/admin-ui';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function SettingsPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [preferredLocale, setPreferredLocale] = useState('en');
  const [baseCurrency, setBaseCurrency] = useState('ZAR');
  const [canEditWorkspace, setCanEditWorkspace] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/settings', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to load settings.');
        if (!alive) return;
        setCanEditWorkspace(json.data?.workspace?.canEdit !== false);
        const p = json.data?.company;
        if (p) {
          setPreferredLocale(p.preferredLocale ?? 'en');
          setBaseCurrency(p.baseCurrency ?? 'ZAR');
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

  const onSave = async () => {
    setOk(null);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredLocale,
          baseCurrency: baseCurrency.trim() || 'ZAR',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to save settings.');
      setOk('Saved.');
      notifySuccess('Preferences saved.');
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to save settings.';
      setError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  const formDisabled = loading || !canEditWorkspace;

  return (
    <SettingsWorkspace
      actions={
        <Button onClick={onSave} disabled={loading || saving || !canEditWorkspace} loading={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 md:gap-5">
        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
        {ok ? <AdminAlertBanner tone="success">{ok}</AdminAlertBanner> : null}
        {!canEditWorkspace ? (
          <AdminAlertBanner tone="warning">View-only access: your role cannot change workspace settings.</AdminAlertBanner>
        ) : null}

        <AdminPanel
          kicker="Preferences"
          description="Language and the currency used across the workspace."
          bodyClassName="mt-0"
        >
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy>
              <Skeleton className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
              <Skeleton className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferred locale" htmlFor="preferred-locale">
                <select
                  id="preferred-locale"
                  className="input ti-select h-11 w-full"
                  value={preferredLocale}
                  onChange={(e) => setPreferredLocale(e.target.value)}
                  disabled={formDisabled}
                >
                  <option value="en">English</option>
                  <option value="af">Afrikaans</option>
                  <option value="zu">Zulu (coming)</option>
                </select>
              </Field>
              <Field label="Base currency" htmlFor="base-currency">
                <Input
                  id="base-currency"
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
                  placeholder="ZAR"
                  disabled={formDisabled}
                />
              </Field>
            </div>
          )}
        </AdminPanel>
      </div>
    </SettingsWorkspace>
  );
}
