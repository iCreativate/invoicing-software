import { Reveal } from '@/components/landing/landingMotion';

const POINTS = [
  {
    title: 'Invoice to payment in one place',
    body: 'Create, send, track and collect without juggling tools.',
  },
  {
    title: 'Clarity before the chase',
    body: "See what's outstanding, overdue and expected — before cash gets tight.",
  },
  {
    title: 'Built for South African businesses',
    body: 'ZAR amounts, local payment context and workflows that match how you actually get paid.',
  },
];

export function TrustSection() {
  return (
    <section className="border-b border-[var(--tl-line)] py-10 sm:py-12">
      <div className="tl-container">
        <Reveal>
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--tl-ink-3)]">
            Built for businesses that want to get paid
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {POINTS.map((p) => (
              <div key={p.title} className="text-center sm:text-left">
                <p className="text-[15px] font-semibold tracking-tight text-[var(--tl-ink)]">{p.title}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--tl-ink-2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
