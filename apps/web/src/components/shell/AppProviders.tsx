'use client';

import type { ReactNode } from 'react';
import { WorkspaceCapabilitiesProvider } from '@/components/workspace/WorkspaceCapabilities';

export function AppProviders({ children }: { children: ReactNode }) {
  return <WorkspaceCapabilitiesProvider>{children}</WorkspaceCapabilitiesProvider>;
}
