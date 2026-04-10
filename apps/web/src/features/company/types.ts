export type CompanyProfile = {
  id: string;
  ownerId: string | null;
  companyName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  vatNumber: string | null;
  logoUrl: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  accountType: string | null;
  /** When column is missing from DB, treat as free plan. */
  subscriptionPlan: string | null;
  preferredLocale: string | null;
  baseCurrency: string | null;
  referralCode: string | null;
  referredByCode: string | null;
  invoiceAccentHex: string | null;
  invoiceHeaderHex: string | null;
  emailTemplateInvoice: string | null;
  emailTemplateReminder: string | null;
};

