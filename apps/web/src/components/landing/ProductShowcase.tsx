import { ProductStage } from '@/components/landing/ProductStage';
import { Reveal } from '@/components/landing/landingMotion';

export function ProductShowcase() {
  return (
    <section id="product" className="border-y border-[var(--tl-line)] bg-[var(--tl-bg-deep)] text-white">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-20 sm:py-28">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Product</p>
          <h2 className="tl-h2 mt-3 max-w-2xl text-white">Your business, at a glance.</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/65">
            Revenue, outstanding, overdue, expected cash and the next actions — the same command centre you open every
            morning.
          </p>
        </Reveal>
        <Reveal delayMs={80} className="mt-12 sm:mt-14">
          <div className="[&_.tl-label]:text-[var(--tl-ink-3)] [&_p]:text-[var(--tl-ink)] [&_span]:text-[var(--tl-ink-2)]">
            <ProductStage />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
