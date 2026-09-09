import { describe, expect, it } from 'vitest';
import { isCrewEmail, parseCrewEmails } from './access';

describe('crew access', () => {
  it('parses comma-separated emails case-insensitively', () => {
    expect(parseCrewEmails(' Ada@Example.com , bob@x.io ')).toEqual([
      'ada@example.com',
      'bob@x.io',
    ]);
    expect(parseCrewEmails('')).toEqual([]);
    expect(parseCrewEmails(undefined)).toEqual([]);
  });

  it('allowlists only configured emails', () => {
    const list = 'john@icreativate.co.za, ops@timelyinvoices.app';
    expect(isCrewEmail('JOHN@icreativate.co.za', list)).toBe(true);
    expect(isCrewEmail('someone@else.com', list)).toBe(false);
    expect(isCrewEmail(null, list)).toBe(false);
    expect(isCrewEmail('john@icreativate.co.za', '')).toBe(false);
  });
});
