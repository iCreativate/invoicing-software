import { redirect } from 'next/navigation';
import { routes } from '@/lib/routing/routes';

export default function IntegrationsRedirect() {
  redirect(routes.app.settingsIntegrations);
}
