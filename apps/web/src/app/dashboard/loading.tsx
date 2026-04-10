import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <AppShell hideHeader>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl p-5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-3 h-8 w-40" />
              <Skeleton className="mt-2 h-3 w-full" />
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl p-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-6 h-64 w-full rounded-xl" />
          </Card>
          <Card className="rounded-xl p-6">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-6 h-64 w-full rounded-xl" />
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl p-6">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-4 h-24 w-full rounded-xl" />
            <Skeleton className="mt-2 h-24 w-full rounded-xl" />
          </Card>
          <Card className="rounded-xl p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-48 w-full rounded-xl" />
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="rounded-xl p-0 overflow-hidden">
            <div className="border-b border-border p-4">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </Card>
          <Card className="rounded-xl p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
