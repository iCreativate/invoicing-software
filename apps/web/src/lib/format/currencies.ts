export type DocumentCurrency = {
  code: string;
  label: string;
  symbol: string;
};

/** Currencies available on invoices and quotes. */
export const DOCUMENT_CURRENCIES: DocumentCurrency[] = [
  { code: 'ZAR', label: 'South African rand', symbol: 'R' },
  { code: 'USD', label: 'US dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British pound', symbol: '£' },
  { code: 'AUD', label: 'Australian dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian dollar', symbol: 'C$' },
  { code: 'NZD', label: 'New Zealand dollar', symbol: 'NZ$' },
  { code: 'CHF', label: 'Swiss franc', symbol: 'CHF' },
  { code: 'JPY', label: 'Japanese yen', symbol: '¥' },
  { code: 'CNY', label: 'Chinese yuan', symbol: '¥' },
  { code: 'INR', label: 'Indian rupee', symbol: '₹' },
  { code: 'AED', label: 'UAE dirham', symbol: 'د.إ' },
  { code: 'BWP', label: 'Botswana pula', symbol: 'P' },
  { code: 'NAD', label: 'Namibian dollar', symbol: 'N$' },
  { code: 'KES', label: 'Kenyan shilling', symbol: 'KSh' },
  { code: 'NGN', label: 'Nigerian naira', symbol: '₦' },
];

export const DOCUMENT_CURRENCY_CODES = new Set(DOCUMENT_CURRENCIES.map((c) => c.code));

export function normalizeDocumentCurrency(code: string | null | undefined, fallback = 'ZAR'): string {
  const upper = String(code ?? fallback)
    .trim()
    .toUpperCase();
  return DOCUMENT_CURRENCY_CODES.has(upper) ? upper : fallback;
}
