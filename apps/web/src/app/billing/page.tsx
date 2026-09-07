import { redirect } from 'next/navigation';
import { routes } from '@/lib/routing/routes';

export default async function BillingRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') q.set(key, value);
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  redirect(`${routes.app.settingsBilling}${suffix}`);
}
