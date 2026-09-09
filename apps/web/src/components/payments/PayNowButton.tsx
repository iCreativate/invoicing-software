'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

type Provider = 'payfast' | 'snapscan';

const METHODS: { id: Provider; title: string; sub: string }[] = [
  { id: 'payfast', title: 'Card & EFT', sub: 'Secure checkout via PayFast' },
  { id: 'snapscan', title: 'SnapScan', sub: 'Pay with QR on your phone' },
];

export function PayNowButton({
  invoiceId,
  shareId,
  disabled,
  label = 'Pay securely',
  compact = false,
}: {
  invoiceId: string;
  /** When set (public invoice / portal), uses share-authenticated create-session (no login). */
  shareId?: string;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('payfast');

  const onPay = async () => {
    setError(null);
    setLoading(true);
    try {
      const useShare = Boolean(shareId && String(shareId).trim());
      const endpoint = useShare ? '/api/payments/create-session-by-share' : '/api/payments/create-session';
      const body = useShare
        ? { shareId: String(shareId).trim(), provider }
        : { invoiceId, provider };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to start payment');
      const url = String(json.data.redirectUrl ?? '');
      if (!url) throw new Error('Missing redirect URL');
      window.location.assign(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <Select
          className="max-w-[11rem]"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          disabled={disabled || loading}
          aria-label="Payment method"
        >
          <option value="payfast">PayFast — card / EFT</option>
          <option value="snapscan">SnapScan — QR</option>
        </Select>
        <Button size="sm" onClick={onPay} disabled={disabled} loading={loading}>
          {label}
        </Button>
        {error ? <p className="ti-field-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {METHODS.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-baseline gap-3">
            <input
              type="radio"
              name="pay-method"
              className="mt-1"
              checked={provider === m.id}
              onChange={() => setProvider(m.id)}
              disabled={disabled || loading}
            />
            <span>
              <span className="text-sm text-[var(--tl-ink)]">{m.title}</span>
              <span className="ti-caption mt-0.5 block">{m.sub}</span>
            </span>
          </label>
        ))}
      </div>
      <Button className="mt-5" onClick={onPay} disabled={disabled} loading={loading}>
        {label}
      </Button>
      {error ? (
        <p className="ti-field-error mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
