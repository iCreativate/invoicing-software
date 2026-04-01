import { ForgotPasswordClient } from './ForgotPasswordClient';

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const initialEmail = (searchParams?.email ?? '').trim();
  return <ForgotPasswordClient initialEmail={initialEmail} />;
}
