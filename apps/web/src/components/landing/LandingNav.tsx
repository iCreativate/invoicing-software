'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#resources', label: 'Resources' },
  { href: routes.marketing.pricing, label: 'Pricing' },
];

export function LandingNav() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-transparent bg-[var(--tl-bg)] transition-[padding,border-color] duration-200',
        compact && 'border-[var(--tl-line)]'
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[var(--tl-max)] items-center justify-between px-[var(--tl-pad)] transition-[padding] duration-200',
          compact ? 'py-3' : 'py-5'
        )}
      >
        <Link href={routes.marketing.home} className="text-[13px] font-semibold tracking-[0.16em] text-[var(--tl-ink)]">
          TIMELY
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[13px] text-[var(--tl-ink-2)] transition-colors hover:text-[var(--tl-ink)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={routes.auth.login}
            className="text-[13px] font-medium text-[var(--tl-ink-2)] transition-colors hover:text-[var(--tl-ink)]"
          >
            Sign in
          </Link>
          <Link
            href={routes.auth.register}
            className="inline-flex h-9 items-center rounded-[var(--tl-radius)] bg-[var(--tl-accent)] px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--tl-radius)] border border-[var(--tl-line)] md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--tl-line)] bg-[var(--tl-bg)] px-[var(--tl-pad)] py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="py-2 text-sm font-medium text-[var(--tl-ink)]"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href={routes.auth.login} className="py-2 text-sm text-[var(--tl-ink-2)]" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link
              href={routes.auth.register}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-[var(--tl-radius)] bg-[var(--tl-accent)] text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Start free
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
