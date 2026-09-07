import Image from 'next/image';
import { formatZarDisplay } from '@/components/landing/formatZar';
import { timelyImages } from '@/components/landing/timelyAssets';

/** Full-bleed editorial breathing room between product sections. */
export function EditorialSection() {
  return (
    <section className="tl-on-dark relative overflow-hidden">
      <div className="relative min-h-[28rem] sm:min-h-[34rem]">
        <Image
          src={timelyImages.lifestyle.creativeStudio}
          alt="Entrepreneur working confidently in a modern creative studio"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--tl-ink)]/85 via-[var(--tl-ink)]/60 to-[var(--tl-ink)]/20"
          aria-hidden
        />
        <div className="tl-container relative flex min-h-[28rem] items-center py-20 sm:min-h-[34rem] sm:py-24">
          <div className="flex max-w-xl flex-col gap-8">
            <h2 className="tl-h2 tl-h2-wide">
              You should be running your business.
              <br />
              Not your invoices.
            </h2>
            <div className="inline-flex w-fit items-center gap-4 rounded-[var(--tl-radius-sm)] border border-white/12 bg-white/[0.08] px-5 py-4 backdrop-blur-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--tl-success)] text-sm font-bold text-white">
                ✓
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white">3 invoices paid</p>
                <p className="tl-num text-[15px] font-semibold text-white/90">
                  {formatZarDisplay(24180)} collected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
