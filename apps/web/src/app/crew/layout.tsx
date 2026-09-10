import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isCrewEmail } from '@/lib/crew/access';
import { CrewShell } from '@/components/crew/CrewShell';

export const metadata = {
  title: 'Crew ops',
  robots: { index: false, follow: false },
};

export default async function CrewLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect('/login?next=/crew');
  }
  const email = String(user.email ?? '').trim();
  if (!isCrewEmail(email)) {
    notFound();
  }
  return <CrewShell email={email}>{children}</CrewShell>;
}
