'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import { LandingPrimaryLink } from '@/components/landing/ProductChrome';

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#story', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

const navLink =
  'rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--tl-ink-2)] transition-colors hover:bg-black/[0.03] hover:text-[var(--tl-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)]';

export function LandingNav() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <a
        href="#main"
        className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--tl-ink)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--tl-accent)]"
      >
        Skip to content
      </a>
      <div className="tl-container pointer-events-auto motion-safe:animate-[tl-fade-up_0.55s_var(--ti-ease)_both]">
        <div
          className={cn(
            'tl-nav-shell flex w-full items-center justify-between gap-3 px-4 sm:px-5',
            compact ? 'is-compact py-2.5' : 'py-3.5'
          )}
        >
          <Link
            href={routes.marketing.home}
            className="shrink-0 text-[13px] font-semibold tracking-[0.18em] text-[var(--tl-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)]"
          >
            TIMELY
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className={navLink}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href={routes.auth.login} className={cn(navLink, 'hidden sm:inline')}>
              Log in
            </Link>
            <LandingPrimaryLink
              href={routes.auth.register}
              className="h-10 shrink-0 px-3 text-[12px] sm:px-4 sm:text-[13px]"
            >
              Start free
            </LandingPrimaryLink>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tl-line)] bg-white/70 text-[var(--tl-ink)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)] lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="pointer-events-auto fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--tl-ink)]/35 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-[var(--tl-line)] bg-[var(--tl-surface)] shadow-[var(--tl-shadow-float)] motion-safe:animate-[tl-slide-in-right_0.28s_var(--ti-ease)_both]"
          >
            <div className="flex items-center justify-between border-b border-[var(--tl-line)] px-5 py-4">
              <span className="text-[13px] font-semibold tracking-[0.18em]">TIMELY</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tl-line)] transition-colors hover:bg-[var(--tl-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)]"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-4 py-5" aria-label="Mobile">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="rounded-[var(--tl-radius-sm)] px-3 py-3 text-base font-medium text-[var(--tl-ink)] transition-colors hover:bg-[var(--tl-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-auto space-y-3 border-t border-[var(--tl-line)] pt-5">
                <Link
                  href={routes.auth.login}
                  className="block rounded-[var(--tl-radius-sm)] px-3 py-3 text-base font-medium text-[var(--tl-ink-2)] transition-colors hover:bg-[var(--tl-bg)] hover:text-[var(--tl-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tl-accent)] sm:hidden"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
