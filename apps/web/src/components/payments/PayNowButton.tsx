'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Provider = 'payfast' | 'snapscan' | 'ozow';

const METHODS: { id: Provider; title: string; sub: string }[] = [
  { id: 'payfast', title: 'Card & EFT', sub: 'Secure checkout via PayFast' },
  { id: 'snapscan', title: 'SnapScan', sub: 'Pay with QR on your phone' },
  { id: 'ozow', title: 'Instant EFT', sub: 'Bank login (Ozow) — connect keys to enable' },
];

export function PayNowButton({
  invoiceId,
  disabled,
  label = 'Pay securely',
  compact = false,
}: {
  invoiceId: string;
  disabled?: boolean;
  label?: string;
  /** Tighter layout for tables / dense rows */
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('payfast');

  const onPay = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, provider }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to start payment');
      const url = String(json.data.redirectUrl ?? '');
      if (!url) throw new Error('Missing redirect URL');
      window.location.assign(url);
    } catch (e: any) {
      setError(e?.message ?? 'Payment failed');
      setLoading(false);
    }
  };

  const active = METHODS.find((m) => m.id === provider)!;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <select
          className="h-9 w-full max-w-[11rem] rounded-lg border border-border bg-card px-2 text-xs font-medium shadow-[var(--shadow-sm)]"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          disabled={disabled || loading}
          aria-label="Payment method"
        >
          <option value="payfast">PayFast — card / EFT</option>
          <option value="snapscan">SnapScan — QR</option>
          <option value="ozow">Ozow — instant EFT</option>
        </select>
        <Button size="sm" className="h-9 w-full max-w-[11rem] text-xs" onClick={onPay} disabled={disabled || loading}>
          <Lock className="mr-1.5 h-3.5 w-3.5 opacity-80" />
          {loading ? 'Opening…' : label}
        </Button>
        {error ? <div className="max-w-[11rem] text-[10px] leading-snug text-danger">{error}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-gradient-to-b from-card to-muted/20 p-4 shadow-[var(--shadow-sm)]',
        'ring-1 ring-black/[0.03] dark:ring-white/[0.06]'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Pay this invoice</div>
          <div className="mt-0.5 text-xs text-muted-foreground">256-bit SSL · You’ll be redirected to your chosen provider</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {METHODS.map((m) => (
          <label
            key={m.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
              provider === m.id
                ? 'border-primary bg-primary/5 shadow-[var(--shadow-sm)]'
                : 'border-border bg-card/60 hover:border-primary/30'
            )}
          >
            <input
              type="radio"
              name="pay-method"
              className="mt-1"
              checked={provider === m.id}
              onChange={() => setProvider(m.id)}
              disabled={disabled || loading}
            />
            <div>
              <div className="text-sm font-semibold">{m.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{m.sub}</div>
            </div>
          </label>
        ))}
      </div>

      <Button className="mt-4 w-full" onClick={onPay} disabled={disabled || loading}>
        <Lock className="mr-2 h-4 w-4 opacity-90" />
        {loading ? 'Opening secure checkout…' : label}
      </Button>

      <div className="mt-3 text-center text-[11px] text-muted-foreground">
        {active.id === 'payfast' ? 'Visa, Mastercard, Mobicred, and more via PayFast.' : null}
        {active.id === 'snapscan' ? 'Opens SnapScan so you can scan and pay.' : null}
        {active.id === 'ozow' ? 'Instant EFT requires Ozow merchant setup in your environment.' : null}
      </div>

      {error ? <div className="mt-2 rounded-xl bg-danger/10 p-2 text-center text-xs text-danger">{error}</div> : null}
    </div>
  );
}
