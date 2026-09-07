import Link from 'next/link';
import { routes } from '@/lib/routing/routes';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#product', label: 'Product' },
      { href: '#story', label: 'How it works' },
      { href: '#pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: routes.marketing.contact, label: 'Contact' },
      { href: routes.marketing.faq, label: 'FAQ' },
      { href: routes.marketing.overview, label: 'Overview' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: routes.marketing.privacy, label: 'Privacy' },
      { href: routes.marketing.terms, label: 'Terms' },
    ],
  },
];

const linkClass =
  'rounded-sm text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50';

export function LandingFooter() {
  return (
    <footer className="tl-on-dark bg-[var(--tl-bg-deep)]">
      <div className="tl-container py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-16">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.16em] text-white">TIMELY</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500">
              Invoice. Collect. Understand.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('#') ? (
                      <a href={l.href} className={linkClass}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-slate-500">© 2026 Timely</p>
          <div className="flex gap-6">
            <Link href={routes.auth.login} className={linkClass}>
              Log in
            </Link>
            <Link href={routes.auth.register} className={linkClass}>
              Start free
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
