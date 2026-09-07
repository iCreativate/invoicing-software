import { Suspense } from 'react';
import { routes } from '@/lib/routing/routes';
import { LoginForm } from './LoginForm';
import { AuthFallback } from '@/components/auth/AuthShell';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = searchParams?.next || routes.app.dashboard;
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginForm nextPath={nextPath} />
    </Suspense>
  );
}
