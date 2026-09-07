import { redirect } from 'next/navigation';
import { routes } from '@/lib/routing/routes';

/** Timely Insights live on the Insights overview. Keep this URL working. */
export default function TimelyInsightsAiRedirect() {
  redirect(routes.app.insights);
}
