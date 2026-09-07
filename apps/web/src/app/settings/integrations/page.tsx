'use client';

import { useEffect, useState } from 'react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminPanel, AdminStatusCard } from '@/components/settings/admin-ui';
import { Skeleton } from '@/components/ui/Skeleton';

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
    fallback: 'Configured via RESEND_API_KEY in server environment.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp (Twilio)',
    description: 'Optional reminder channel for SA clients.',
    statusKey: 'whatsapp' as const,
    fallback: 'Configured via Twilio env vars when enabled.',
  },
  {
    id: 'payfast',
    name: 'PayFast',
    description: 'Card / Instant EFT payment links for invoices.',
    statusKey: null,
    fallback: 'Merchant credentials are managed with your PayFast settings.',
  },
  {
    id: 'snapscan',
    name: 'SnapScan',
    description: 'QR / app payments popular with SA customers.',
    statusKey: null,
    fallback: 'SnapScan details are managed with your payment settings.',
  },
];

export default function SettingsIntegrationsPage() {
  const [status, setStatus] = useState<MessagingStatus | null>(null);
  const [statusKnown, setStatusKnown] = useState(false);
  const [loading, setLoading] = useState(true);

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsWorkspace>
      <AdminPanel
        kicker="Integrations"
        description="Email, WhatsApp, and payment providers that power collections."
        bodyClassName="mt-0"
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((item) => {
            if (loading) {
              return (
                <li key={item.id}>
                  <Skeleton className="h-24 w-full rounded-[var(--tl-radius-sm)]" />
                </li>
              );
            }

            let badge = 'Configured in settings';
            let badgeTone: 'outline' | 'default' | 'success' = 'outline';
            if (item.statusKey && statusKnown && status) {
              const on = Boolean(status[item.statusKey]);
              badge = on ? 'Connected' : 'Not configured';
              badgeTone = on ? 'success' : 'outline';
            } else if (item.statusKey && !statusKnown) {
              badge = 'Status unknown';
            }

            return (
              <li key={item.id}>
                <AdminStatusCard
                  title={item.name}
                  description={item.description}
                  badge={badge}
                  badgeTone={badgeTone}
                />
              </li>
            );
          })}
        </ul>
      </AdminPanel>
    </SettingsWorkspace>
  );
}
