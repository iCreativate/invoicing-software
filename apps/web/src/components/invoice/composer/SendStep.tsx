'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoney } from '@/lib/format/money';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, Mail, MessageCircle, Send } from 'lucide-react';

export function SendStep({
  currency,
  total,
  submitting,
  onCreateAndSend,
}: {
  currency: string;
  total: number;
  submitting: boolean;
  onCreateAndSend: (args: { email: string; whatsapp: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [shareReady, setShareReady] = useState(false);
  const [resendReady, setResendReady] = useState<boolean | null>(null);

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
    <div className="rounded-2xl bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Send invoice</div>
          <div className="mt-1 text-sm text-muted-foreground">Email, optional WhatsApp, and a shareable link.</div>
        </div>
        <Badge variant="outline">{formatMoney(total, currency)}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium inline-flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email (optional)
          </label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp (optional)
          </label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+27…" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          onClick={() => setShareReady(true)}
        >
          <LinkIcon className="h-4 w-4" /> Generate share link
        </button>
        {shareReady ? (
          <div className="text-xs text-muted-foreground">
            Link will be created after sending.
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="primary"
          disabled={submitting}
          onClick={() => onCreateAndSend({ email, whatsapp })}
          className="w-full"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Sending…' : 'Create & Send'}
        </Button>
        <div className="mt-2 text-xs text-muted-foreground">
          {resendReady === null ? (
            <span>Checking email configuration…</span>
          ) : resendReady ? (
            <span className="text-success">Email delivery is configured (RESEND_API_KEY on the server).</span>
          ) : (
            <span>
              To send by email, add <span className="font-mono text-[11px]">RESEND_API_KEY</span> to{' '}
              <span className="font-mono text-[11px]">apps/web/.env.local</span>, then restart{' '}
              <span className="font-mono text-[11px]">npm run dev</span> (or set it in Netlify and redeploy).
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
