'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/routing/routes';

type MessagingStatus = {
  resend?: boolean;
  whatsapp?: boolean;
};

const INTEGRATIONS = [
  {
    id: 'email',
    name: 'Email (Resend)',
    description: 'Transactional invoice and reminder email.',
    statusKey: 'resend' as const,
    fallback: 'Configured via RESEND_API_KEY in server environment / Settings.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp (Twilio)',
    description: 'Optional reminder channel for SA clients.',
    statusKey: 'whatsapp' as const,
    fallback: 'Configured via Twilio env vars in Settings when enabled.',
  },
  {
    id: 'payfast',
    name: 'PayFast',
    description: 'Card / Instant EFT payment links for invoices.',
    statusKey: null,
    fallback: 'Merchant credentials are managed in Settings → Payments.',
  },
  {
    id: 'snapscan',
    name: 'SnapScan',
    description: 'QR / app payments popular with SA customers.',
    statusKey: null,
    fallback: 'SnapScan details are managed in Settings → Payments.',
  },
];

export default function IntegrationsPage() {
  const [status, setStatus] = useState<MessagingStatus | null>(null);
  const [statusKnown, setStatusKnown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/messaging/status', { credentials: 'include' });
        if (!res.ok) throw new Error('unavailable');
        const json = (await res.json()) as MessagingStatus;
        if (!cancelled) {
          setStatus(json);
          setStatusKnown(true);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
          setStatusKnown(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Integrations">
      <PageBody>
        <PageHeader
          title="Integrations"
          description="Email, WhatsApp, and payment providers that power collections."
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href={routes.app.settings}>Open settings</Link>
            </Button>
          }
        />

        <ul className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((item) => {
            let badge = 'Configured in settings';
            let tone: 'outline' | 'default' = 'outline';
            if (item.statusKey && statusKnown && status) {
              const on = Boolean(status[item.statusKey]);
              badge = on ? 'Connected' : 'Not configured';
              tone = on ? 'default' : 'outline';
            } else if (item.statusKey && !statusKnown) {
              badge = item.fallback;
            } else if (!item.statusKey) {
              badge = item.fallback;
            }

            return (
              <li key={item.id}>
                <GlassCard className="flex flex-col gap-3 p-4 transition-[box-shadow,border-color] duration-150 hover:shadow-[var(--ti-shadow)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-foreground">{item.name}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant={tone} className="max-w-full whitespace-normal font-normal sm:max-w-xs">
                    {badge}
                  </Badge>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </PageBody>
    </AppShell>
  );
}
