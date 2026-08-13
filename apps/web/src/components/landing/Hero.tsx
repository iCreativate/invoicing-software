import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { ProductStage } from '@/components/landing/ProductStage';
import { Reveal } from '@/components/landing/landingMotion';

export function Hero() {
  return (
    <section className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <Reveal>
          <p className="tl-label">TimelyInvoices</p>
          <h1 className="tl-display mt-5 text-[var(--tl-ink)]">
            Invoice.
            <br />
            Collect.
            <br />
            Understand.
          </h1>
          <p className="tl-body mt-6 max-w-md">
            TimelyInvoices gives small businesses one clear place to send invoices, collect payments and understand their
            cashflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={routes.auth.register}
              className="inline-flex h-11 items-center rounded-[var(--tl-radius)] bg-[var(--tl-accent)] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
            <Link
              href="#product"
              className="inline-flex h-11 items-center rounded-[var(--tl-radius)] border border-[var(--tl-line-strong)] bg-transparent px-5 text-sm font-medium text-[var(--tl-ink)] transition-colors hover:bg-[var(--tl-surface)]"
            >
              See how it works
            </Link>
          </div>
        </Reveal>

        <Reveal delayMs={80} className="min-w-0">
          <ProductStage />
        </Reveal>
      </div>
    </section>
  );
}
