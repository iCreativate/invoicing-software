export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'cash'
  | 'cheque'
  | 'mobile_money'
  | 'paystack'
  | 'flutterwave';

export type PaymentListItem = {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  payment_date: string;
  notes: string | null;
};

