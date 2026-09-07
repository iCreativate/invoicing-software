'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Amount } from '@/components/ui/Text';
import { formatMoney } from '@/lib/format/money';
import { Download } from 'lucide-react';

export function SendStep({
  currency,
  total,
  submitting,
  onCreateAndSend,
  onDownloadPdf,
  defaultEmail = '',
  actionLabel = 'Send invoice',
  amountLabel = 'Amount due',
}: {
  currency: string;
  total: number;
  submitting: boolean;
  onCreateAndSend: (args: { email: string; whatsapp: string }) => Promise<void>;
  onDownloadPdf?: () => void;
  defaultEmail?: string;
  actionLabel?: string;
  amountLabel?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [whatsapp, setWhatsapp] = useState('');
  const [shareReady, setShareReady] = useState(false);
  const [resendReady, setResendReady] = useState<boolean | null>(null);

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/messaging/status')
      .then((r) => r.json())
      .then((d: { resend?: boolean }) => {
        if (!cancelled) setResendReady(Boolean(d?.resend));
      })
      .catch(() => {
        if (!cancelled) setResendReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="ti-meta">{amountLabel}</p>
        <Amount display className="mt-2 block">
          {formatMoney(total, currency)}
        </Amount>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" type="email" />
        </Field>
        <Field label="WhatsApp">
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+27…" />
        </Field>
      </div>

      <div>
        <button
          type="button"
          className="text-sm font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
          onClick={() => setShareReady(true)}
        >
          Include a shareable link
        </button>
        {shareReady ? <p className="ti-caption mt-2">The link is created when you send.</p> : null}
      </div>

      <div className="ti-composer-dock">
        {onDownloadPdf ? (
          <Button type="button" variant="secondary" disabled={submitting} onClick={onDownloadPdf}>
            <Download className="h-4 w-4" aria-hidden />
            PDF
          </Button>
        ) : null}
        <Button
          type="button"
          loading={submitting}
          onClick={() => void onCreateAndSend({ email, whatsapp })}
        >
          {actionLabel}
        </Button>
      </div>
      <p className="ti-caption">
        {resendReady === null
          ? 'Checking email delivery…'
          : resendReady
            ? 'Email delivery is configured.'
            : 'Email sends once RESEND_API_KEY is set on the server.'}
      </p>
    </div>
  );
}
