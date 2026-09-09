import { describe, expect, it } from 'vitest';
import { accountBlockMessage, isAccountBlocked } from './accountLifecycle';

describe('accountLifecycle', () => {
  it('blocks suspended and terminated only', () => {
    expect(isAccountBlocked('active')).toBe(false);
    expect(isAccountBlocked('suspended')).toBe(true);
    expect(isAccountBlocked('terminated')).toBe(true);
    expect(isAccountBlocked(null)).toBe(false);
  });

  it('returns readable block messages', () => {
    expect(accountBlockMessage('suspended')).toMatch(/suspended/i);
    expect(accountBlockMessage('terminated')).toMatch(/terminated/i);
  });
});
