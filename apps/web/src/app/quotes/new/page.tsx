'use client';

import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { RedirectIfReadOnly } from '@/components/workspace/RedirectIfReadOnly';
import { routes } from '@/lib/routing/routes';
import { Skeleton } from '@/components/ui/Skeleton';

const InvoiceComposerModal = dynamic(
  () => import('@/components/invoice/composer/InvoiceComposerModal').then((m) => m.InvoiceComposerModal),
  {
    ssr: false,
    loading: () => (
      <div className="ti-composer-page" aria-busy>
        <div className="ti-composer-workspace">
          <div className="ti-composer-sheet overflow-hidden">
            <div className="ti-composer-mast">
              <div>
                <Skeleton className="h-3 w-24 bg-white/20" />
                <Skeleton className="mt-3 h-10 w-48 bg-white/25" />
              </div>
              <Skeleton className="h-7 w-28 bg-white/20" />
            </div>
            <div className="ti-composer-sheet-body space-y-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
          <div className="ti-composer-live">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-[28rem] w-full" />
          </div>
        </div>
      </div>
    ),
  }
);

function NewQuoteComposer() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  return (
    <RedirectIfReadOnly href={routes.app.quotes}>
      <AppShell title="New quote" fullWidth hideHeader>
        <div className="w-full">
          <InvoiceComposerModal
            open={true}
            onOpenChange={() => {}}
            mode="page"
            kind="quote"
            initialClientId={clientId}
          />
        </div>
      </AppShell>
    </RedirectIfReadOnly>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <AppShell title="New quote" fullWidth hideHeader>
          <div className="ti-composer-page" aria-busy>
            <div className="ti-composer-workspace">
              <div className="ti-composer-sheet overflow-hidden">
                <div className="ti-composer-mast">
                  <div>
                    <Skeleton className="h-3 w-24 bg-white/20" />
                    <Skeleton className="mt-3 h-10 w-48 bg-white/25" />
                  </div>
                </div>
                <div className="ti-composer-sheet-body space-y-6">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </div>
              <div className="ti-composer-live">
                <Skeleton className="h-[28rem] w-full" />
              </div>
            </div>
          </div>
        </AppShell>
      }
    >
      <NewQuoteComposer />
    </Suspense>
  );
}
