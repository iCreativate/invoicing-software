'use client';

import { useEffect, useRef } from 'react';

export function PublicInvoiceViewTracker({ shareId }: { shareId: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (!shareId || done.current) return;
    done.current = true;
    void fetch('/api/invoices/public-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId }),
    }).catch(() => {});
  }, [shareId]);

  return null;
}
