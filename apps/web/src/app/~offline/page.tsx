import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">You are offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          TimelyInvoices will show cached pages when available. Reconnect to sync invoices and payments.
        </p>
      </div>
      <div className="flex justify-center">
        <Button type="button" asChild>
          <Link href={routes.app.dashboard}>Try dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
