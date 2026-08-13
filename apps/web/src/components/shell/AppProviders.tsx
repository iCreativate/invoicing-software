'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { WorkspaceCapabilitiesProvider } from '@/components/workspace/WorkspaceCapabilities';
import { isPublicShellPath } from '@/lib/routing/routes';

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Only skip on public marketing/auth shells. Never branch on `document` / demo cookies
  // here — that causes SSR vs client provider trees to diverge (hydration mismatch).
  const skipWorkspace = isPublicShellPath(pathname);

  if (skipWorkspace) {
    return (
      <>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </>
    );
  }

  return (
    <WorkspaceCapabilitiesProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </WorkspaceCapabilitiesProvider>
  );
}
