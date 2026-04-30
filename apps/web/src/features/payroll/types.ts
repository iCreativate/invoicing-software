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

/** Current editable payroll row (backed by payroll_compensation + employees). */
export type PayrollCompensationRow = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  currency: string;
};

export type PayrollRunLineItem = {
  id: string;
  employeeId: string | null;
  employeeName: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  currency: string;
  sortOrder: number;
};
