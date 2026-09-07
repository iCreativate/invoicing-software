'use client';

import { forwardRef, useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { getInvoiceTemplate, INVOICE_TEMPLATE_PRESETS } from '@/lib/invoices/templates';
import { DOCUMENT_CURRENCIES, DOCUMENT_CURRENCY_CODES } from '@/lib/format/currencies';
import type { InvoiceComposerDraft, InvoiceComposerTemplate } from './types';
import { cn } from '@/lib/utils/cn';
import { Field } from '@/components/ui/Field';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';

type Props = {
  draft: InvoiceComposerDraft;
  onCurrencyChange: (code: string) => void;
  onTemplateChange: (template: InvoiceComposerTemplate) => void;
  documentKind: 'invoice' | 'quote';
  className?: string;
};

type ComposerDropdownTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const ComposerDropdownTrigger = forwardRef<HTMLButtonElement, ComposerDropdownTriggerProps>(
  ({ children, className, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'input flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 text-left text-sm font-medium text-[var(--tl-ink)]',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
      </button>
    );
  }
);
ComposerDropdownTrigger.displayName = 'ComposerDropdownTrigger';

export function ComposerDocumentOptions({
  draft,
  onCurrencyChange,
  onTemplateChange,
  documentKind,
  className,
}: Props) {
  const isQuote = documentKind === 'quote';
  const currencies = useMemo(() => {
    const code = draft.currency.trim().toUpperCase();
    if (!code || DOCUMENT_CURRENCY_CODES.has(code)) return DOCUMENT_CURRENCIES;
    return [{ code, label: code, symbol: code }, ...DOCUMENT_CURRENCIES];
  }, [draft.currency]);

  const selectedCurrency = currencies.find((c) => c.code === draft.currency) ?? currencies[0];
  const selectedTemplate = getInvoiceTemplate(draft.template);

  return (
    <div
      className={cn(
        'ti-no-print relative z-20 border-b border-[var(--tl-line)] bg-[color-mix(in_srgb,var(--tl-bg)_38%,white)] px-5 py-3 md:px-7',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <Field label="Currency" className="w-full shrink-0 sm:w-44">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <ComposerDropdownTrigger aria-label="Choose currency">
                <span className="min-w-0 truncate tabular-nums">
                  {selectedCurrency.code}
                  <span className="ml-1.5 font-normal text-[var(--tl-ink-3)]">{selectedCurrency.symbol}</span>
                </span>
              </ComposerDropdownTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[120] max-h-72 w-56 overflow-y-auto">
              {currencies.map((currency) => {
                const selected = draft.currency === currency.code;
                return (
                  <DropdownMenuItem
                    key={currency.code}
                    className="cursor-pointer flex items-center justify-between gap-3 py-2.5"
                    onSelect={() => onCurrencyChange(currency.code)}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold tabular-nums">{currency.code}</span>
                      <span className="block truncate text-xs text-[var(--tl-ink-3)]">{currency.label}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[var(--tl-ink-3)]">
                      <span className="text-xs">{currency.symbol}</span>
                      {selected ? <Check className="h-3.5 w-3.5 text-[var(--tl-accent)]" aria-hidden /> : null}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </Field>

        <Field label={isQuote ? 'Quote template' : 'Invoice template'} className="min-w-0 flex-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <ComposerDropdownTrigger aria-label="Choose document template">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-8 shrink-0 rounded-full ring-1 ring-black/8"
                    style={{ backgroundColor: selectedTemplate.accentHex }}
                    aria-hidden
                  />
                  <span className="truncate">{selectedTemplate.label}</span>
                </span>
              </ComposerDropdownTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[120] max-h-80 w-[min(100vw-2rem,20rem)] overflow-y-auto p-1.5">
              {INVOICE_TEMPLATE_PRESETS.map((template) => {
                const selected = draft.template === template.id;
                return (
                  <DropdownMenuItem
                    key={template.id}
                    className={cn(
                      'cursor-pointer flex items-start gap-3 rounded-[calc(var(--radius-card)-6px)] px-2.5 py-2.5',
                      selected && 'bg-[color-mix(in_srgb,var(--tl-accent)_8%,white)]'
                    )}
                    onSelect={() => onTemplateChange(template.id)}
                  >
                    <span
                      className="mt-1.5 h-2 w-10 shrink-0 rounded-full ring-1 ring-black/8"
                      style={{ backgroundColor: template.accentHex }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--tl-ink)]">{template.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-[var(--tl-ink-3)]">{template.description}</span>
                    </span>
                    {selected ? <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--tl-accent)]" aria-hidden /> : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </Field>
      </div>
    </div>
  );
}
