import { Suspense } from 'react';
import { RegisterClient } from './RegisterClient';
import { AuthFallback } from '@/components/auth/AuthShell';

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <RegisterClient />
    </Suspense>
  );
}
