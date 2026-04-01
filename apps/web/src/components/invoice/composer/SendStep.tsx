'use client';

import { useState } from 'react';
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

  return (
    <div className="rounded-2xl bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Send invoice</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Email + WhatsApp + shareable link.
          </div>
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
          Requires `RESEND_API_KEY` for email and Twilio env vars for WhatsApp.
        </div>
      </div>
    </div>
  );
}

