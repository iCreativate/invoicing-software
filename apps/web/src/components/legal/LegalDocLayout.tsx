import Link from 'next/link';
import { Layers } from 'lucide-react';
import { routes } from '@/lib/routing/routes';

const navy = '#0B1C2C';
const pageBg = '#F8FAFC';

type LegalDocLayoutProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalDocLayout({ title, lastUpdated, children }: LegalDocLayoutProps) {
  return (
    <div
      className="min-h-dvh overflow-x-hidden antialiased"
      style={{ backgroundColor: pageBg, color: navy, fontFamily: 'inherit' }}
    >
      <header
        className="sticky top-0 z-40 border-b border-slate-200/60 backdrop-blur-2xl backdrop-saturate-150"
        style={{
          background: 'linear-gradient(180deg, rgba(248,250,252,0.92) 0%, rgba(248,250,252,0.78) 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:h-16">
          <Link href={routes.marketing.home} className="group flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 shadow-md transition duration-300 group-hover:scale-[1.03] sm:h-10 sm:w-10"
              style={{
                background: `linear-gradient(145deg, ${navy} 0%, #132f47 100%)`,
                boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 24px -8px rgba(11,28,44,0.35)',
              }}
            >
              <Layers className="h-[1rem] w-[1rem] text-white sm:h-[1.15rem] sm:w-[1.15rem]" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight sm:text-[0.9375rem]">TimelyInvoices</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">South Africa</div>
            </div>
          </Link>
          <Link href={routes.marketing.home} className="text-sm font-medium text-slate-500 transition hover:text-[#0B1C2C]">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-[max(1rem,env(safe-area-inset-left))] pb-[max(2rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] pt-10 sm:pt-14">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        <div className="prose prose-slate mt-10 max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:text-[#0B1C2C] prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-[#0B1C2C] prose-a:underline-offset-2 hover:prose-a:text-slate-900">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-200/70 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>© {new Date().getFullYear()} TimelyInvoices</span>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-end">
            <Link href={routes.marketing.privacy} className="hover:text-[#0B1C2C]">
              Privacy Policy
            </Link>
            <Link href={routes.marketing.terms} className="hover:text-[#0B1C2C]">
              Terms of Service
            </Link>
            <Link href={`${routes.marketing.home}#pricing`} className="hover:text-[#0B1C2C]">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
