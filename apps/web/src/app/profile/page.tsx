import { redirect } from 'next/navigation';
import { routes } from '@/lib/routing/routes';

export default function ProfileRedirect() {
  redirect(routes.app.settingsProfile);
}
