import type { ReactNode } from 'react';
import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { AuthVisual } from '@/components/auth/AuthVisual';
import { Skeleton } from '@/components/ui/Skeleton';

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="ti-auth min-h-dvh bg-[var(--tl-bg)] text-[var(--tl-ink)] lg:grid lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-[var(--tl-bg-deep)] px-12 py-12 text-[var(--tl-bg)] lg:flex xl:px-16">
        <Link href={routes.marketing.home} className="text-[13px] font-semibold tracking-[0.16em] text-[var(--tl-bg)]">
          TIMELY
        </Link>
        <div className="max-w-md">
          <h1 className="tl-display text-[clamp(2.5rem,5vw,4.25rem)] text-white">
            Invoice.
            <br />
            Collect.
            <br />
            Understand.
          </h1>
          <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-white/55">
            Financial clarity for businesses that want to spend less time chasing money.
          </p>
          <AuthVisual />
        </div>
        <p className="text-[12px] text-white/30">© {new Date().getFullYear()} Timely</p>
      </aside>

      <div className="flex min-h-dvh flex-col pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="lg:hidden">
          <Link href={routes.marketing.home} className="text-[13px] font-semibold tracking-[0.16em]">
            TIMELY
          </Link>
          <p className="mt-2 text-[12px] text-[var(--tl-ink-3)]">Invoice. Collect. Understand.</p>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12 sm:py-16">
          <div className="ti-auth-panel mx-auto w-full max-w-[22.5rem]">
            <h1 className="ti-h1">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[var(--tl-ink-2)]">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthFallback() {
  return (
    <div className="min-h-dvh bg-[var(--tl-bg)] lg:grid lg:grid-cols-2">
      <div className="hidden bg-[var(--tl-bg-deep)] lg:block" />
      <div className="flex min-h-dvh items-center px-6">
        <div className="mx-auto w-full max-w-[22.5rem] space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
