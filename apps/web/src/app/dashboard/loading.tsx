import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-3">
          <Skeleton className="h-40 w-full" />
        </Card>
        <Skeleton className="h-28 w-full rounded-[var(--radius-xl)]" />
        <Skeleton className="h-28 w-full rounded-[var(--radius-xl)]" />
        <Skeleton className="h-28 w-full rounded-[var(--radius-xl)]" />
      </div>
    </AppShell>
  );
}
