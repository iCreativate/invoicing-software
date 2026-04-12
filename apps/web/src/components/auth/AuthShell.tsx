import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { routes } from '@/lib/routing/routes';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_560px_at_18%_0%,hsl(var(--primary)/0.22),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_480px_at_92%_12%,rgba(99,102,241,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.015))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.02))]" />
      </div>

      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-[max(3.5rem,env(safe-area-inset-top))] sm:pb-[max(3.5rem,env(safe-area-inset-bottom))]">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10">
          <div className="flex items-center justify-between gap-4">
            <Link href={routes.marketing.home} className="flex items-center gap-2.5 rounded-xl outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">TimelyInvoices</div>
                <div className="text-xs text-muted-foreground">Invoicing for South Africa</div>
              </div>
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
