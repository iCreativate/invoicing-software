'use client';

import { API_BASE } from '@/app/config';
import React from 'react';

interface Company {
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  vatNumber?: string;
  website?: string;
}

interface Client {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total?: number;
}

interface InvoicePreviewProps {
  company: Company;
  client: Client;
  invoiceNumber: string;
  accountNumber?: string;
  issueDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  disclaimer?: string;
  template?: string;
  paymentMethod?: {
    bank?: string;
    accountType?: string;
    branchCode?: string;
    account?: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  bankAccounts?: Array<{
    bankName: string;
    accountName?: string;
    accountNumber: string;
    branchCode?: string;
    swiftCode?: string;
    type?: string;
  }>;
}

export default function InvoicePreview({
  company,
  client,
  invoiceNumber,
  accountNumber,
  issueDate,
  dueDate,
  items,
  notes,
  terms,
  disclaimer,
  template = 'modern',
  paymentMethod,
  colors = {
    primary: '#2563eb',
    secondary: '#9333ea',
    accent: '#3b82f6',
  },
  bankAccounts = [],
}: InvoicePreviewProps) {
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.total || (item.quantity * item.unitPrice);
      return sum + itemTotal;
    }, 0);
    
    const taxAmount = items.reduce((sum, item) => {
      const itemTotal = item.total || (item.quantity * item.unitPrice);
      const tax = item.taxRate ? (itemTotal * item.taxRate / 100) : 0;
      return sum + tax;
    }, 0);
    
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const totals = calculateTotals();
  const formattedDate = new Date(issueDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Template-specific styles (all use custom colors)
  const getTemplateStyles = () => {
    switch (template) {
      case 'classic':
        return {
          container: 'bg-white p-4 sm:p-8 w-full max-w-4xl mx-auto border-2 min-w-0',
          headerStyle: 'border-b-4 pb-4 mb-6',
          invoiceBadge: 'text-white px-6 py-3 inline-block',
          tableHeader: 'text-white',
          totalsBox: 'border-2',
          borderColor: colors.primary,
        };
      case 'minimal':
        return {
          container: 'bg-white p-4 sm:p-8 w-full max-w-4xl mx-auto min-w-0',
          headerStyle: 'border-b pb-4 mb-6',
          invoiceBadge: 'text-gray-900 border-b-2 pb-2 inline-block',
          tableHeader: 'text-white',
          totalsBox: 'border',
          borderColor: colors.primary,
        };
      default: // modern
        return {
          container: 'bg-white p-4 sm:p-8 rounded-lg w-full max-w-4xl mx-auto min-w-0',
          headerStyle: '',
          invoiceBadge: '',
          tableHeader: '',
          totalsBox: '',
          borderColor: colors.primary,
        };
    }
  };

  const templateStyles = getTemplateStyles();

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin-bottom: 180px; /* Space for footer (Thanks message + contact info + decorative lines) */
          }
          .invoice-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            padding: 1.5rem 20mm !important;
            border-top: 1px solid #e5e7eb !important;
            z-index: 1000 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .invoice-footer * {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .invoice-footer p,
          .invoice-footer div,
          .invoice-footer span {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .invoice-content {
            padding-bottom: 200px; /* Ensure content doesn't overlap footer */
          }
          /* Prevent page breaks inside sections - keep titles with content */
          .invoice-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .invoice-section-title {
            page-break-after: avoid;
            break-after: avoid;
          }
          /* Keep table rows together when possible */
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Prevent orphaned section titles */
          .invoice-section h3 {
            page-break-after: avoid;
            break-after: avoid;
          }
        }
      `}</style>
      <div 
        className={templateStyles.container} 
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderColor: template === 'classic' ? templateStyles.borderColor : undefined,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100vh',
          paddingBottom: '180px',
        }}
      >
      {/* Main Content */}
      <div className="invoice-content" style={{ flex: '1 0 auto' }}>
      {/* Header */}
      <div 
        className={`flex justify-between items-start mb-8 ${templateStyles.headerStyle}`}
        style={template === 'classic' || template === 'minimal' ? { borderColor: templateStyles.borderColor } : {}}
      >
        {/* Company Logo/Name */}
        <div className="flex-1">
          {company.logo ? (
            <img 
              src={company.logo.startsWith('http') ? company.logo : `${API_BASE}${company.logo}`} 
              alt={company.name}
              className="mb-2"
              style={{ 
                height: '90px', 
                width: '165px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <h1 className={`${template === 'minimal' ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>{company.name}</h1>
            </div>
          )}
        </div>

        {/* Invoice Header */}
        <div className="text-right">
          {template === 'modern' ? (
            <div 
              className="px-8 py-4 rounded-lg"
              style={{ 
                backgroundColor: colors.primary,
              }}
            >
              <h2 className="text-3xl font-bold text-white">INVOICE</h2>
            </div>
          ) : template === 'classic' ? (
            <div 
              className={templateStyles.invoiceBadge}
              style={{ backgroundColor: colors.primary }}
            >
              <h2 className="text-2xl font-bold">INVOICE</h2>
            </div>
          ) : (
            <div 
              className={templateStyles.invoiceBadge}
              style={{ borderColor: colors.primary, color: colors.primary }}
            >
              <h2 className="text-2xl font-semibold">INVOICE</h2>
          </div>
          )}
          <div className="mt-4 space-y-1 text-sm text-gray-700">
            <div><span className="font-semibold">INVOICE NO.:</span> #{invoiceNumber}</div>
            {accountNumber && <div><span className="font-semibold">Account No:</span> {accountNumber}</div>}
            <div><span className="font-semibold">Invoice Date:</span> {formattedDate}</div>
            {dueDate && (
              <div><span className="font-semibold">Due Date:</span> {new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice To Section */}
      <div className="mb-8 invoice-section">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 invoice-section-title">Invoice To:</h3>
        <div 
          className={`p-4 ${template === 'classic' ? 'border-2' : 'rounded-lg'}`}
          style={{ 
            backgroundColor: template === 'minimal' ? 'transparent' : 'rgba(249, 250, 251, 0.8)',
            borderColor: template === 'classic' ? templateStyles.borderColor : 'transparent',
            borderLeftWidth: template === 'minimal' ? '4px' : undefined,
            borderLeftColor: template === 'minimal' ? colors.primary : undefined,
            paddingLeft: template === 'minimal' ? '1rem' : undefined,
          }}
        >
          <div className="font-bold text-gray-900 text-lg mb-1">{client.name}</div>
          {client.phone && <div className="text-gray-600">P: {client.phone}</div>}
          {client.email && <div className="text-gray-600">E: {client.email}</div>}
          {client.address && <div className="text-gray-600">{client.address}</div>}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 overflow-x-auto">
        <table 
          className={`w-full ${template === 'classic' ? 'border-collapse border' : 'border-collapse'}`}
          style={template === 'classic' ? { borderColor: templateStyles.borderColor } : {}}
        >
          <thead>
            <tr>
              {template === 'modern' ? (
                <>
              <th 
                className="text-white text-left py-3 px-4 font-semibold rounded-tl-lg"
                style={{ 
                  backgroundColor: colors.primary,
                }}
              >
                Item description
              </th>
              <th 
                className="text-white text-center py-3 px-4 font-semibold"
                style={{ 
                  backgroundColor: colors.accent,
                }}
              >
                Quantity
              </th>
              <th 
                className="text-white text-right py-3 px-4 font-semibold"
                style={{ 
                  backgroundColor: colors.accent,
                }}
              >
                Unit Price
              </th>
              <th 
                className="text-white text-right py-3 px-4 font-semibold rounded-tr-lg"
                style={{ 
                  backgroundColor: colors.secondary,
                    }}
                  >
                    Total Price
                  </th>
                </>
              ) : (
                <>
                  <th 
                    className={`${templateStyles.tableHeader} text-left py-3 px-4 font-semibold ${template === 'classic' ? 'border' : ''}`}
                    style={{ 
                      backgroundColor: colors.primary,
                      borderColor: template === 'classic' ? templateStyles.borderColor : 'transparent',
                    }}
                  >
                    Item description
                  </th>
                  <th 
                    className={`${templateStyles.tableHeader} text-center py-3 px-4 font-semibold ${template === 'classic' ? 'border' : ''}`}
                    style={{ 
                      backgroundColor: colors.accent,
                      borderColor: template === 'classic' ? templateStyles.borderColor : 'transparent',
                    }}
                  >
                    Quantity
                  </th>
                  <th 
                    className={`${templateStyles.tableHeader} text-right py-3 px-4 font-semibold ${template === 'classic' ? 'border' : ''}`}
                    style={{ 
                      backgroundColor: colors.accent,
                      borderColor: template === 'classic' ? templateStyles.borderColor : 'transparent',
                    }}
                  >
                    Unit Price
                  </th>
                  <th 
                    className={`${templateStyles.tableHeader} text-right py-3 px-4 font-semibold ${template === 'classic' ? 'border' : ''}`}
                    style={{ 
                      backgroundColor: colors.secondary,
                      borderColor: template === 'classic' ? templateStyles.borderColor : 'transparent',
                }}
              >
                Total Price
              </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const itemTotal = item.total || (item.quantity * item.unitPrice);
              return (
                <tr 
                  key={index} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${template === 'classic' ? 'border' : ''}`}
                  style={template === 'classic' ? { borderColor: templateStyles.borderColor } : {}}
                >
                  <td 
                    className={`py-4 px-4 text-gray-700 ${template === 'classic' ? 'border' : ''}`}
                    style={template === 'classic' ? { borderColor: templateStyles.borderColor } : {}}
                  >
                    <div className="font-medium">{item.description}</div>
                  </td>
                  <td 
                    className={`py-4 px-4 text-center text-gray-700 ${template === 'classic' ? 'border' : ''}`}
                    style={template === 'classic' ? { borderColor: templateStyles.borderColor } : {}}
                  >
                    {item.quantity.toString().padStart(2, '0')}
                  </td>
                  <td 
                    className={`py-4 px-4 text-right text-gray-700 ${template === 'classic' ? 'border' : ''}`}
                    style={template === 'classic' ? { borderColor: templateStyles.borderColor } : {}}
                  >
                    R {item.unitPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td 
                    className={`py-4 px-4 text-right font-semibold text-gray-900 ${template === 'classic' ? 'border' : ''}`}
                    style={template === 'classic' ? { borderColor: templateStyles.borderColor } : {}}
                  >
                    R {itemTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-6 invoice-section">
        <div className="w-80">
          {template === 'modern' ? (
          <div 
              className="rounded-lg p-4 space-y-2"
            style={{ 
              backgroundColor: colors.primary,
            }}
          >
            <div className="flex justify-between text-white">
              <span className="font-semibold">Sub Total:</span>
              <span className="font-bold">R {totals.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-white">
              <span className="font-semibold">Vat:</span>
              <span className="font-bold">R {totals.taxAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-white text-lg pt-2 border-t border-white/30">
              <span className="font-bold">Grand Total:</span>
              <span className="font-bold text-xl">R {totals.total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          ) : template === 'classic' ? (
            <div 
              className={`${templateStyles.totalsBox} p-4 space-y-2`}
              style={{ 
                backgroundColor: colors.primary,
                borderColor: templateStyles.borderColor,
              }}
            >
              <div className="flex justify-between text-white">
                <span className="font-semibold">Sub Total:</span>
                <span className="font-bold">R {totals.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-white">
                <span className="font-semibold">Vat:</span>
                <span className="font-bold">R {totals.taxAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div 
                className="flex justify-between text-white text-lg pt-2 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                <span className="font-bold">Grand Total:</span>
                <span className="font-bold text-xl">R {totals.total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          ) : (
            <div 
              className={`${templateStyles.totalsBox} p-4 space-y-2`}
              style={{ 
                backgroundColor: colors.primary,
                borderColor: templateStyles.borderColor,
              }}
            >
              <div className="flex justify-between text-white">
                <span className="font-semibold">Sub Total:</span>
                <span className="font-bold">R {totals.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-white">
                <span className="font-semibold">Vat:</span>
                <span className="font-bold">R {totals.taxAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div 
                className="flex justify-between text-white text-lg pt-2 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                <span className="font-bold">Grand Total:</span>
                <span className="font-bold text-xl">R {totals.total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bank Accounts */}
      {bankAccounts && bankAccounts.length > 0 && (
        <div className="mb-6 invoice-section">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 invoice-section-title">Banking Details</h3>
          <div className="space-y-3">
            {bankAccounts.map((account, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4" style={{ borderLeftColor: colors.primary }}>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="font-bold text-gray-900">{account.bankName}</div>
                  {account.accountName && <div><span className="font-semibold">Account Name:</span> {account.accountName}</div>}
                  <div><span className="font-semibold">Account Number:</span> {account.accountNumber}</div>
                  {account.branchCode && <div><span className="font-semibold">Branch Code:</span> {account.branchCode}</div>}
                  {account.swiftCode && <div><span className="font-semibold">SWIFT Code:</span> {account.swiftCode}</div>}
                  {account.type && <div><span className="font-semibold">Account Type:</span> {account.type.charAt(0).toUpperCase() + account.type.slice(1)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method */}
      {paymentMethod && (
        <div className="mb-6 invoice-section">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 invoice-section-title">Payment method</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm text-gray-700">
            {paymentMethod.bank && <div><span className="font-semibold">Bank:</span> {paymentMethod.bank}</div>}
            {paymentMethod.accountType && <div><span className="font-semibold">Account Type:</span> {paymentMethod.accountType}</div>}
            {paymentMethod.branchCode && <div><span className="font-semibold">Branch Code:</span> {paymentMethod.branchCode}</div>}
            {paymentMethod.account && <div><span className="font-semibold">Account:</span> {paymentMethod.account}</div>}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {terms && (
        <div className="mb-6 invoice-section">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 invoice-section-title">Terms & Conditions</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{terms}</p>
        </div>
      )}
      </div>

      {/* Footer - Always at bottom of page */}
      <div 
        className="invoice-footer pt-8 border-t border-gray-200"
        style={{
          marginTop: 'auto',
          paddingTop: '2rem',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          width: '100%',
        }}
      >
        <div className="text-center mb-4">
          <p className="thanks-line text-gray-700 font-medium">Thanks for your business!</p>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-4">
          {company.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{company.phone}</span>
            </div>
          )}
          {company.website && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>{company.website}</span>
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{company.email}</span>
            </div>
          )}
        </div>
        
        {/* Decorative Wave - Only for modern template */}
        {template === 'modern' && (
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="flex-1" style={{ backgroundColor: colors.primary }}></div>
            <div className="flex-1" style={{ backgroundColor: colors.accent }}></div>
            <div className="flex-1" style={{ backgroundColor: colors.secondary }}></div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
