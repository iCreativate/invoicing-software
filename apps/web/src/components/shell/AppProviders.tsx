'use client';

import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { WorkspaceCapabilitiesProvider } from '@/components/workspace/WorkspaceCapabilities';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WorkspaceCapabilitiesProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </WorkspaceCapabilitiesProvider>
  );
}
