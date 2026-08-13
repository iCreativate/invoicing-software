import Link from 'next/link';
import { routes } from '@/lib/routing/routes';

const COLS = [
  {
    title: 'Product',
    links: [
      { href: '#product', label: 'Overview' },
      { href: '#solutions', label: 'How it works' },
      { href: routes.marketing.pricing, label: 'Pricing' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { href: '#solutions', label: 'Invoicing' },
      { href: '#solutions', label: 'Collections' },
      { href: '#solutions', label: 'Cashflow' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: routes.marketing.faq, label: 'FAQ' },
      { href: routes.marketing.overview, label: 'Product tour' },
      { href: routes.marketing.contact, label: 'Contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: routes.marketing.contact, label: 'About' },
      { href: routes.auth.register, label: 'Start free' },
      { href: routes.auth.login, label: 'Sign in' },
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

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--tl-line)] bg-[var(--tl-bg)]">
      <div className="mx-auto max-w-[var(--tl-max)] px-[var(--tl-pad)] py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.16em]">TIMELY</p>
            <p className="mt-3 max-w-xs text-sm text-[var(--tl-ink-2)]">
              Premium invoicing and cashflow for South African businesses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
            {COLS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold text-[var(--tl-ink)]">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-[var(--tl-ink-2)] transition-colors hover:text-[var(--tl-ink)]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tl-line)] pt-6 text-xs text-[var(--tl-ink-3)]">
          <span>© {new Date().getFullYear()} TimelyInvoices</span>
          <a href="mailto:hello@timelyinvoices.com" className="hover:text-[var(--tl-ink)]">
            hello@timelyinvoices.com
          </a>
        </div>
      </div>
    </footer>
  );
}
