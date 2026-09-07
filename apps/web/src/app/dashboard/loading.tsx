import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <AppShell hideHeader>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <div>
          <Skeleton className="h-3 w-36" />
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-14 w-72 max-w-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-6 h-56 w-full" />
        </div>

        <div className="grid gap-12 border-t border-border pt-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
