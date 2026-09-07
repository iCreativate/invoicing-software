'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminPanel, AdminStatusCard } from '@/components/settings/admin-ui';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';

type MessagingStatus = {
  resend?: boolean;
  whatsapp?: boolean;
};

export default function SettingsNotificationsPage() {
  const [status, setStatus] = useState<MessagingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/messaging/status', { credentials: 'include' });
        if (!res.ok) return;
        const json = (await res.json()) as MessagingStatus;
        if (!cancelled) setStatus(json);
      } catch {
        // status stays unknown
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
        kicker="Notification preferences"
        description="The bell in the top bar is the primary place to read workspace events. Use this page to see how Timely can notify you."
        bodyClassName="mt-0"
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {loading ? (
            <>
              <li>
                <Skeleton className="h-24 w-full rounded-[var(--tl-radius-sm)]" />
              </li>
              <li>
                <Skeleton className="h-24 w-full rounded-[var(--tl-radius-sm)]" />
              </li>
            </>
          ) : (
            <>
              <li>
                <AdminStatusCard
                  title="Email"
                  description="Invoice and reminder emails."
                  badge={status?.resend ? 'Ready' : 'Not configured'}
                  badgeTone={status?.resend ? 'success' : 'outline'}
                />
              </li>
              <li>
                <AdminStatusCard
                  title="WhatsApp"
                  description="Optional reminder channel."
                  badge={status?.whatsapp ? 'Ready' : 'Not configured'}
                  badgeTone={status?.whatsapp ? 'success' : 'outline'}
                />
              </li>
            </>
          )}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={routes.app.notifications}>Open notification centre</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={routes.app.settingsIntegrations}>Integrations</Link>
          </Button>
        </div>
      </AdminPanel>
    </SettingsWorkspace>
  );
}
