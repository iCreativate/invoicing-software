import { describe, expect, it } from 'vitest';
import { addDaysISO, stepFiresToday, reminderMessageForStep } from './schedule';

describe('collections schedule', () => {
  it('adds days across month boundaries', () => {
    expect(addDaysISO('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDaysISO('2026-08-15', -3)).toBe('2026-08-12');
  });

  it('fires before-due step on correct day', () => {
    expect(stepFiresToday('2026-08-15', -3, '2026-08-12')).toBe(true);
    expect(stepFiresToday('2026-08-15', -3, '2026-08-13')).toBe(false);
  });

  it('fires due and overdue steps', () => {
    expect(stepFiresToday('2026-08-15', 0, '2026-08-15')).toBe(true);
    expect(stepFiresToday('2026-08-15', 3, '2026-08-18')).toBe(true);
    expect(stepFiresToday('2026-08-15', 7, '2026-08-22')).toBe(true);
  });

  it('builds non-empty reminder copy', () => {
    const msg = reminderMessageForStep({
      offsetDays: 3,
      invoiceNumber: 'INV-1',
      clientName: 'Acme',
      amountLabel: 'R100.00',
      dueDate: '2026-08-01',
    });
    expect(msg).toContain('INV-1');
    expect(msg).toContain('Acme');
  });
});
