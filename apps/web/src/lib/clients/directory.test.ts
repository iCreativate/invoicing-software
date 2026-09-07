import { describe, expect, it } from 'vitest';
import { buildClientDirectory, clientDirectoryStatus } from './directory';

describe('buildClientDirectory', () => {
  it('rolls up outstanding, overdue and last payment per client', () => {
    const rows = buildClientDirectory(
      [
        { id: 'a', name: 'Acme', email: 'a@x.com', companyName: null },
        { id: 'b', name: 'New Co', email: null, companyName: null },
      ],
      [
        {
          clientId: 'a',
          status: 'overdue',
          balance: 1000,
          paid: 0,
          paidDate: null,
          dueDate: '2020-01-01',
          currency: 'ZAR',
        },
        {
          clientId: 'a',
          status: 'paid',
          balance: 0,
          paid: 500,
          paidDate: '2026-08-01',
          dueDate: '2026-07-01',
          currency: 'ZAR',
        },
      ],
      '2026-08-17'
    );

    expect(rows[0]?.status).toBe('overdue');
    expect(rows[0]?.outstanding).toBe(1000);
    expect(rows[0]?.invoiceCount).toBe(2);
    expect(rows[0]?.lastPayment).toBe('2026-08-01');
    expect(rows[1]?.status).toBe('new');
  });

  it('classifies status from counts', () => {
    expect(clientDirectoryStatus({ invoiceCount: 0, outstanding: 0, overdueCount: 0 })).toBe('new');
    expect(clientDirectoryStatus({ invoiceCount: 2, outstanding: 0, overdueCount: 0 })).toBe('active');
    expect(clientDirectoryStatus({ invoiceCount: 2, outstanding: 50, overdueCount: 0 })).toBe('outstanding');
    expect(clientDirectoryStatus({ invoiceCount: 2, outstanding: 50, overdueCount: 1 })).toBe('overdue');
  });
});
