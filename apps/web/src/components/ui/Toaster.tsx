'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      closeButton
      duration={4000}
      toastOptions={{
        className: 'ti-toast',
        duration: 4000,
      }}
    />
  );
}
