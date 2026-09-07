import type { PaymentMethod } from '@/features/payments/types';

export function methodLabel(m: string) {
  const map: Record<string, string> = {
    bank_transfer: 'EFT',
    card: 'Card',
    cash: 'Cash',
    cheque: 'Cheque',
    mobile_money: 'Mobile money',
    paystack: 'Paystack',
    flutterwave: 'Flutterwave',
  };
  if (map[m]) return map[m];
  return m
    .split('_')
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

export function providerLabel(p: string | null) {
  if (!p) return '—';
  const k = p.toLowerCase();
  if (k === 'payfast') return 'PayFast';
  if (k === 'stripe') return 'Stripe';
  if (k === 'yoco') return 'Yoco';
  if (k === 'snapscan') return 'SnapScan';
  if (k === 'ozow') return 'Ozow';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  { value: 'bank_transfer', label: 'EFT', description: 'Bank transfer or deposit' },
  { value: 'card', label: 'Card', description: 'Card terminal or online' },
  { value: 'cash', label: 'Cash', description: 'Cash in hand' },
  { value: 'cheque', label: 'Cheque', description: 'Cheque payment' },
  { value: 'mobile_money', label: 'Mobile', description: 'Mobile money wallet' },
  { value: 'paystack', label: 'Paystack', description: 'Paystack gateway' },
  { value: 'flutterwave', label: 'Flutterwave', description: 'Flutterwave gateway' },
];

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatPaymentDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
