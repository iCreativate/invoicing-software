/**
 * Pure helpers for collections automation date matching.
 * offsetDays: negative = before due, 0 = due day, positive = overdue.
 */

export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Calendar date in Africa/Johannesburg (SA default). */
export function todayInJohannesburg(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export type CollectionCandidate = {
  invoiceId: string;
  dueDate: string;
  offsetDays: number;
  stepId: string;
  channel: string;
};

/**
 * Returns true when today matches dueDate + offsetDays.
 */
export function stepFiresToday(dueDate: string, offsetDays: number, todayISO: string): boolean {
  return addDaysISO(dueDate, offsetDays) === todayISO.slice(0, 10);
}

export const DEFAULT_COLLECTION_STEPS: { offset_days: number; channel: string; template_key: string; sort_order: number }[] = [
  { offset_days: -3, channel: 'email', template_key: 'before_due', sort_order: 0 },
  { offset_days: 0, channel: 'email', template_key: 'due', sort_order: 1 },
  { offset_days: 3, channel: 'email', template_key: 'overdue_3', sort_order: 2 },
  { offset_days: 7, channel: 'email', template_key: 'overdue_7', sort_order: 3 },
];

export function reminderMessageForStep(args: {
  offsetDays: number;
  invoiceNumber: string;
  clientName: string;
  amountLabel: string;
  dueDate: string;
  viewUrl?: string;
}): string {
  const { offsetDays, invoiceNumber, clientName, amountLabel, dueDate, viewUrl } = args;
  const link = viewUrl ? `\n\nView invoice: ${viewUrl}` : '';
  if (offsetDays < 0) {
    return `Hi ${clientName},\n\nFriendly reminder that invoice ${invoiceNumber} (${amountLabel}) is due on ${dueDate}.${link}\n\nThank you.`;
  }
  if (offsetDays === 0) {
    return `Hi ${clientName},\n\nInvoice ${invoiceNumber} (${amountLabel}) is due today (${dueDate}). Please arrange payment at your earliest convenience.${link}\n\nThank you.`;
  }
  return `Hi ${clientName},\n\nInvoice ${invoiceNumber} (${amountLabel}) was due on ${dueDate} and remains outstanding (${offsetDays} day(s) overdue). Please settle this balance soon.${link}\n\nThank you.`;
}
