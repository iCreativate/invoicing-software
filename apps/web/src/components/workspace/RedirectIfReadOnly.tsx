'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

export function RedirectIfReadOnly({ href, children }: { href: string; children: ReactNode }) {
  const { canEdit, status } = useWorkspaceCapabilities();
  const router = useRouter();

  useEffect(() => {
    if (status === 'ready' && !canEdit) router.replace(href);
  }, [status, canEdit, router, href]);

  if (status === 'loading' || status === 'idle') {
    return (
      <AppShell title="Loading">
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }
  if (!canEdit) return null;
  return <>{children}</>;
}
