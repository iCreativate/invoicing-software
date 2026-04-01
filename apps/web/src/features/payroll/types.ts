export type PayrollRunStatus = 'draft' | 'processing' | 'paid';

export type PayrollRunListItem = {
  id: string;
  period: string;
  payDate: string;
  employeesCount: number;
  totalAmount: number;
  currency: string;
  status: PayrollRunStatus;
};

