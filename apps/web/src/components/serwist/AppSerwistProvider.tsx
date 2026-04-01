'use client';

import type { ReactNode } from 'react';
import { SerwistProvider } from '@serwist/turbopack/react';

export function AppSerwistProvider({ children }: { children: ReactNode }) {
  const disable = process.env.NODE_ENV === 'development';
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={disable}>
      {children}
    </SerwistProvider>
  );
}
