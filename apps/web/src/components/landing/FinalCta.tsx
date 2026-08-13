import Link from 'next/link';
import { routes } from '@/lib/routing/routes';
import { Reveal } from '@/components/landing/landingMotion';

export function FinalCta() {
  return (
    <section className="bg-[var(--tl-bg-deep)] text-white">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-24 sm:py-32">
        <Reveal>
          <h2 className="tl-display max-w-3xl text-white">Get paid without the chase.</h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/60">
            Your invoices should work as hard as you do.
          </p>
          <Link
            href={routes.auth.register}
            className="mt-10 inline-flex h-12 items-center rounded-[var(--tl-radius)] bg-white px-6 text-sm font-semibold text-[var(--tl-bg-deep)] transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
