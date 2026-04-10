import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { Button } from '@/components/ui/Button';

export default function TimeTrackingPage() {
  return (
    <AppShell title="Time tracking">
      <Card className="rounded-xl border-border p-8 sm:p-10 text-center shadow-[var(--shadow-sm)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
          <Clock className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">Timers & billable hours</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Track time against clients and projects, then convert entries to invoice line items. This module is planned;
          your data and auth stay on the existing workspace.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild variant="primary">
            <Link href={`${routes.app.invoices}/new`}>Bill from invoice</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={routes.app.clients}>Clients</Link>
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
