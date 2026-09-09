import { describe, expect, it } from 'vitest';
import {
  buildEftReference,
  eftAmountCentsForPlan,
  getEftBankDetailsFromEnv,
  isPaidEftPlan,
} from './eft';

describe('eft helpers', () => {
  it('builds TI-{shortId} reference from owner uuid', () => {
    expect(buildEftReference('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('TI-A1B2C3D4');
  });

  it('maps published plan prices to cents', () => {
    expect(eftAmountCentsForPlan('pro')).toBe(5900);
    expect(eftAmountCentsForPlan('business')).toBe(79900);
    expect(eftAmountCentsForPlan('free')).toBeNull();
  });

  it('reads bank details from env without hardcoding secrets', () => {
    const d = getEftBankDetailsFromEnv({
      TIMELY_EFT_BANK_NAME: 'Example Bank',
      TIMELY_EFT_ACCOUNT_NAME: 'Example Holder',
      TIMELY_EFT_ACCOUNT_NUMBER: '0000000000',
      TIMELY_EFT_BRANCH_CODE: '000000',
      TIMELY_EFT_ACCOUNT_TYPE: 'Savings',
    });
    expect(d.configured).toBe(true);
    expect(d.bankName).toBe('Example Bank');
    expect(d.accountNameDisplay).toBe('Account name: Example Holder · Trading as Timely Invoices');
  });

  it('omits Trading as when account name is already Timely Invoices', () => {
    const d = getEftBankDetailsFromEnv({
      TIMELY_EFT_BANK_NAME: 'Example Bank',
      TIMELY_EFT_ACCOUNT_NAME: 'Timely Invoices',
      TIMELY_EFT_ACCOUNT_NUMBER: '0000000000',
      TIMELY_EFT_BRANCH_CODE: '000000',
      TIMELY_EFT_ACCOUNT_TYPE: 'Savings',
    });
    expect(d.accountNameDisplay).toBe('Account name: Timely Invoices');
    expect(d.accountNameDisplay).not.toContain('Trading as');
  });

  it('treats only pro/business as EFT upgrade plans', () => {
    expect(isPaidEftPlan('pro')).toBe(true);
    expect(isPaidEftPlan('business')).toBe(true);
    expect(isPaidEftPlan('free')).toBe(false);
  });
});
