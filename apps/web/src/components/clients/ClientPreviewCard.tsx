'use client';

import Link from 'next/link';
import { Building2, Globe, Mail, MapPin, Phone, User } from 'lucide-react';
import type { ClientFormValues, ClientKind } from '@/lib/clients/form';
import { displayName } from '@/lib/clients/form';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';

function initials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function ClientPreviewCard({
  values,
  kind,
  className,
}: {
  values: ClientFormValues;
  kind: ClientKind;
  className?: string;
}) {
  const title = displayName(values, kind);
  const hasContact = Boolean(values.name.trim() && kind === 'business');
  const hasEmail = Boolean(values.email.trim());
  const hasPhone = Boolean((values.phone ?? '').trim());
  const hasAddress = Boolean((values.address ?? '').trim());
  const hasVat = Boolean((values.vatNumber ?? '').trim());
  const hasReg = Boolean((values.companyRegistration ?? '').trim());
  const hasWebsite = Boolean((values.website ?? '').trim());
  const empty = !title || title === 'New client';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-surface)] shadow-[var(--shadow-elevated)]',
        className
      )}
    >
      <div className="border-b border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3">
        <p className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Invoice preview</p>
        <p className="mt-1 text-[12px] text-[var(--tl-ink-3)]">How this client appears on documents</p>
      </div>

      <div className="p-4">
        {empty ? (
          <div className="rounded-[var(--tl-radius-sm)] border border-dashed border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-8 text-center">
            <User className="mx-auto h-8 w-8 text-[var(--tl-ink-3)]" aria-hidden />
            <p className="mt-3 text-[13px] font-medium text-[var(--tl-ink-2)]">Start typing to see a live preview</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tl-accent)_12%,white)] text-[13px] font-bold text-[var(--tl-accent)]"
              aria-hidden
            >
              {initials(title)}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-[15px] font-semibold text-[var(--tl-ink)]">{title}</p>
                {hasContact ? (
                  <p className="mt-0.5 text-[13px] text-[var(--tl-ink-2)]">Attn: {values.name.trim()}</p>
                ) : null}
              </div>

              <ul className="space-y-1.5 text-[13px] text-[var(--tl-ink-2)]">
                {hasEmail ? (
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                    <span className="truncate">{values.email.trim()}</span>
                  </li>
                ) : null}
                {hasPhone ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                    <span>{(values.phone ?? '').trim()}</span>
                  </li>
                ) : null}
                {hasWebsite ? (
                  <li className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                    <span className="truncate">{(values.website ?? '').trim()}</span>
                  </li>
                ) : null}
                {hasReg ? (
                  <li className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                    <span>Reg {(values.companyRegistration ?? '').trim()}</span>
                  </li>
                ) : null}
                {hasVat ? (
                  <li className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                    <span>VAT {(values.vatNumber ?? '').trim()}</span>
                  </li>
                ) : null}
                {hasAddress ? (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                    <span className="whitespace-pre-wrap">{(values.address ?? '').trim()}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientFormTips() {
  return (
    <ul className="space-y-3 text-[13px] leading-relaxed text-[var(--tl-ink-2)]">
      <li className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tl-accent)]" aria-hidden />
        Client details flow into invoices, quotes, and payment reminders.
      </li>
      <li className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tl-accent)]" aria-hidden />
        VAT and registration numbers print on tax invoices when provided.
      </li>
      <li className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tl-accent)]" aria-hidden />
        Consistent naming helps AI pricing and client search work better.
      </li>
      <li className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tl-accent)]" aria-hidden />
        You can add more detail later from the{' '}
        <Link href={routes.app.clients} className="font-medium text-[var(--tl-ink)] hover:underline">
          client profile
        </Link>
        .
      </li>
    </ul>
  );
}
