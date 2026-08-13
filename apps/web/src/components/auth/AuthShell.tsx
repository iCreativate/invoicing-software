import Link from 'next/link';
import { routes } from '@/lib/routing/routes';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-[max(3.5rem,env(safe-area-inset-top))] sm:pb-[max(3.5rem,env(safe-area-inset-bottom))]">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10">
          <div className="flex items-center justify-between gap-4">
            <Link href={routes.marketing.home} className="rounded-[var(--tl-radius)] outline-none transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40">
              <div className="text-[13px] font-semibold tracking-[0.16em] text-foreground">TIMELY</div>
            </Link>
            <Link
              href={routes.marketing.home}
              className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
            >
              ← Home
            </Link>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{subtitle}</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} TimelyInvoices</span>
          <span className="mx-2 text-border">·</span>
          <Link href="/#pricing" className="underline-offset-2 hover:text-foreground hover:underline">
            Pricing
          </Link>
        </footer>
      </div>
    </div>
  );
}
