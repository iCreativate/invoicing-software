import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isCrewEmail } from '@/lib/crew/access';

export default async function CrewLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  if (!isCrewEmail(email)) {
    notFound();
  }
  return <>{children}</>;
}
