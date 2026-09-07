import { redirect } from 'next/navigation';
import { routes } from '@/lib/routing/routes';

export default function CompanyProfileRedirect() {
  redirect(routes.app.settings);
}
