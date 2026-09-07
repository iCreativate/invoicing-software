import { Suspense } from 'react';
import { InvoicesPageClient } from './InvoicesPageClient';

export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesPageClient />
    </Suspense>
  );
}
