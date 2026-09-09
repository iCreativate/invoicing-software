import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { AuthVisual } from '@/components/auth/AuthVisual';
import { timelyImages } from '@/components/landing/timelyAssets';
import { Surface } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';

type AuthShellProps = {
  title: string;
  kicker?: string;
  subtitle?: string;
  imageSrc?: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  kicker,
  subtitle,
  imageSrc = timelyImages.lifestyle.hero,
  children,
}: AuthShellProps) {
  return (
    <div className="ti-auth min-h-dvh bg-[var(--tl-bg)] text-[var(--tl-ink)] lg:grid lg:grid-cols-2">
      <aside className="relative hidden min-h-dvh overflow-hidden lg:flex">
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="(min-width: 1024px) 50vw, 0px"
        />
        <div className="ti-auth-photo-scrim" aria-hidden />
        <div className="relative z-10 flex min-h-dvh w-full flex-col justify-between px-12 py-12 xl:px-16">
          <Link href={routes.marketing.home} className="text-[13px] font-semibold tracking-[0.16em] text-[var(--tl-bg)]">
            TIMELY
          </Link>
          <div className="max-w-md">
            <p className="tl-display text-[var(--tl-bg)]">
              Invoice.
              <br />
              Collect.
              <br />
              Understand.
            </p>
            <p className="ti-body mt-6 max-w-sm text-[var(--tl-bg)]/75">
              Financial clarity for businesses that want to spend less time chasing money.
            </p>
            <AuthVisual />
          </div>
          <p className="ti-caption text-[var(--tl-bg)]/45">© {new Date().getFullYear()} Timely</p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="relative h-48 overflow-hidden lg:hidden">
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 0px, 100vw"
          />
          <div className="ti-auth-photo-scrim ti-auth-photo-scrim--mobile" aria-hidden />
          <div className="relative z-10 flex h-full flex-col justify-between px-[max(1.25rem,env(safe-area-inset-left))] pb-5 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))]">
            <Link href={routes.marketing.home} className="text-[13px] font-semibold tracking-[0.16em] text-[var(--tl-bg)]">
              TIMELY
            </Link>
            <p className="ti-caption text-[var(--tl-bg)]/80">Invoice. Collect. Understand.</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-10 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-16">
          <Surface variant="elevated" className="ti-auth-panel mx-auto w-full max-w-[26rem] px-6 py-8 sm:px-8 sm:py-9">
            {kicker ? <Text variant="meta">{kicker}</Text> : null}
            <Text variant="h1" className={kicker ? 'mt-2' : undefined}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="body" className="mt-2 text-[var(--tl-ink-2)]">
                {subtitle}
              </Text>
            ) : null}
            <div className="mt-8">{children}</div>
          </Surface>
        </main>
      </div>
    </div>
  );
}

export function AuthFallback() {
  return (
    <div className="min-h-dvh bg-[var(--tl-bg)] lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[var(--tl-navy)] lg:block">
        <div className="ti-auth-photo-scrim" aria-hidden />
      </div>
      <div className="flex min-h-dvh flex-col">
        <div className="h-48 bg-[var(--tl-navy)] lg:hidden" />
        <div className="flex flex-1 items-center px-6">
          <Surface variant="elevated" className="mx-auto w-full max-w-[26rem] space-y-6 px-6 py-8 sm:px-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </Surface>
        </div>
      </div>
    </div>
  );
}
