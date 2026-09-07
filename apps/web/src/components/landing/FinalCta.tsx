import Image from 'next/image';
import { routes } from '@/lib/routing/routes';
import { LandingPrimaryLink, LandingSecondaryLink } from '@/components/landing/ProductChrome';
import { timelyImages } from '@/components/landing/timelyAssets';

export function FinalCta() {
  return (
    <section className="tl-on-dark relative overflow-hidden">
      <div className="relative min-h-[28rem] sm:min-h-[30rem]">
        <Image
          src={timelyImages.lifestyle.finalCta}
          alt="Entrepreneur finishing work in a modern studio at golden hour"
          fill
          className="object-cover object-[center_30%] opacity-55"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--tl-ink)] via-[var(--tl-ink)]/88 to-[var(--tl-ink)]/75"
          aria-hidden
        />
        <div className="tl-container relative flex min-h-[28rem] items-center justify-center py-20 text-center sm:min-h-[30rem] sm:py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="tl-h2 tl-h2-wide mx-auto">
              Less chasing.
              <br />
              More clarity.
            </h2>
            <p className="mx-auto mt-6 max-w-sm text-[17px] leading-relaxed text-slate-200">
              Start invoicing smarter today.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LandingPrimaryLink href={routes.auth.register} className="h-12 w-full justify-center px-7 sm:w-auto">
                Start free
              </LandingPrimaryLink>
              <LandingSecondaryLink href="#pricing" className="h-12 w-full justify-center px-7 sm:w-auto">
                View pricing
              </LandingSecondaryLink>
            </div>
            <p className="mt-5 text-[13px] text-slate-400">No credit card · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
