import type { CompanyProfile } from '@/features/company/types';

export type InvoicePreviewCompanyDetails = {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  vatNumber?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branchCode?: string | null;
  accountType?: string | null;
};

export function hasBankingDetails(details?: InvoicePreviewCompanyDetails | null): boolean {
  if (!details) return false;
  return Boolean(
    details.bankName?.trim() ||
      details.accountName?.trim() ||
      details.accountNumber?.trim() ||
      details.branchCode?.trim() ||
      details.accountType?.trim()
  );
}

export function mapCompanyProfileToPreviewDetails(
  company: CompanyProfile | null | undefined
): InvoicePreviewCompanyDetails | null {
  if (!company) return null;
  return {
    email: company.email,
    phone: company.phone,
    address: company.address,
    website: company.website,
    vatNumber: company.vatNumber,
    bankName: company.bankName,
    accountName: company.accountName,
    accountNumber: company.accountNumber,
    branchCode: company.branchCode,
    accountType: company.accountType,
  };
}

export function mapCompanyRowToPreviewDetails(row: Record<string, unknown> | null | undefined): InvoicePreviewCompanyDetails | null {
  if (!row) return null;
  return {
    email: row.email != null ? String(row.email) : null,
    phone: row.phone != null ? String(row.phone) : null,
    address: row.address != null ? String(row.address) : null,
    website: row.website != null ? String(row.website) : null,
    vatNumber: row.vat_number != null ? String(row.vat_number) : row.vatNumber != null ? String(row.vatNumber) : null,
    bankName: row.bank_name != null ? String(row.bank_name) : row.bankName != null ? String(row.bankName) : null,
    accountName: row.account_name != null ? String(row.account_name) : row.accountName != null ? String(row.accountName) : null,
    accountNumber:
      row.account_number != null ? String(row.account_number) : row.accountNumber != null ? String(row.accountNumber) : null,
    branchCode: row.branch_code != null ? String(row.branch_code) : row.branchCode != null ? String(row.branchCode) : null,
    accountType: row.account_type != null ? String(row.account_type) : row.accountType != null ? String(row.accountType) : null,
  };
}
