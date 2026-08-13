import { describe, expect, it } from 'vitest';
import { getPlan, hasEntitlement, normalizePlanId, subscriptionShowsPoweredBy } from './entitlements';

describe('entitlements', () => {
  it('normalizes unknown plans to free', () => {
    expect(normalizePlanId('enterprise')).toBe('free');
    expect(normalizePlanId('PRO')).toBe('pro');
  });

  it('gates powered-by on free only', () => {
    expect(subscriptionShowsPoweredBy('free')).toBe(true);
    expect(subscriptionShowsPoweredBy('pro')).toBe(false);
    expect(subscriptionShowsPoweredBy('business')).toBe(false);
  });

  it('exposes published prices', () => {
    expect(getPlan('pro').priceZarMonthly).toBe(299);
    expect(getPlan('business').priceZarMonthly).toBe(799);
  });

  it('requires pro for payment links', () => {
    expect(hasEntitlement('free', 'payment_links')).toBe(false);
    expect(hasEntitlement('pro', 'payment_links')).toBe(true);
  });
});
