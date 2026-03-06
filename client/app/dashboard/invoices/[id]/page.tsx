'use client';

import { API_BASE } from '@/app/config';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DashboardLayout from '../../../components/DashboardLayout';
import InvoicePreview from '../../../components/InvoicePreview';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  status: string;
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  company: {
    id: string;
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
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>;
}

export default function InvoiceViewPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<Array<{ bankName: string; accountName?: string; accountNumber: string; branchCode?: string; swiftCode?: string; type?: string }>>([]);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(false);
  const [invoiceNumberDraft, setInvoiceNumberDraft] = useState('');
  const [savingNumber, setSavingNumber] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchInvoice(invoiceId);
  }, [invoiceId, router]);

  useEffect(() => {
    if (invoice?.company?.id) {
      fetchBankAccounts(invoice.company.id);
    }
  }, [invoice?.company?.id]);

  const fetchBankAccounts = async (companyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/banking/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const accounts = data.data?.accounts ?? data.data?.bankAccounts ?? (Array.isArray(data.data) ? data.data : []);
        const active = (accounts as any[]).filter((acc: any) => acc.isActive !== false);
        setBankAccounts(active.map((acc: any) => ({
          bankName: acc.bankName || '',
          accountName: acc.accountName,
          accountNumber: acc.accountNumber || '',
          branchCode: acc.branchCode,
          swiftCode: acc.swiftCode,
          type: acc.type,
        })));
      }
    } catch {
      setBankAccounts([]);
    }
  };

  const fetchInvoice = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInvoice(data.data.invoice);
        }
      } else {
        alert('Failed to load invoice');
        router.push('/dashboard/invoices');
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('An error occurred while loading the invoice');
      router.push('/dashboard/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const saveInvoiceNumber = async () => {
    if (!invoice || !invoiceNumberDraft.trim()) return;
    setSavingNumber(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceNumber: invoiceNumberDraft.trim() }),
      });
      if (response.ok) {
        setInvoice((prev) => (prev ? { ...prev, invoiceNumber: invoiceNumberDraft.trim() } : null));
        setEditingInvoiceNumber(false);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error?.message || 'Failed to update invoice number');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update invoice number');
    } finally {
      setSavingNumber(false);
    }
  };

  const handleDownloadPDF = async () => {
    const el = invoicePreviewRef.current;
    if (!el || !invoice) return;

    // Open immediately on click so the browser allows it (popup must be in direct response to user gesture).
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback: print in current window so user can "Save as PDF".
      window.print();
      alert('Popup was blocked. Print dialog opened in this tab — choose "Save as PDF" as the destination to download.');
      return;
    }

    setGeneratingPDF(true);
    try {
      // html2canvas does not support modern CSS color functions like lab()/oklch()
      // (used by Tailwind v4), so we generate a PDF via the browser print engine.

      const invoiceOuterHTML = el.outerHTML;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      // Collect all CSS so the print document looks exactly like the app (same styles).
      const stylesheets: string[] = [];
      const seenCss = new Set<string>();

      // 1. Inline CSS from document.styleSheets when possible (same-origin or inline)
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          const rules = sheet.cssRules || (sheet as CSSStyleSheet & { rules?: CSSRuleList }).rules;
          if (rules && rules.length > 0) {
            let cssText = '';
            for (let j = 0; j < rules.length; j++) {
              cssText += rules[j].cssText + '\n';
            }
            const key = cssText.substring(0, 80);
            if (cssText && !seenCss.has(key)) {
              seenCss.add(key);
              stylesheets.push(`<style>${cssText}</style>`);
            }
          } else if (sheet.href) {
            // Could not read rules (e.g. CORS); keep as link with absolute URL
            const href = sheet.href.startsWith('http') ? sheet.href : origin + (sheet.href.startsWith('/') ? sheet.href : '/' + sheet.href);
            stylesheets.push(`<link rel="stylesheet" href="${href}">`);
          }
        } catch {
          // Cross-origin or restricted; add as link if we have href
          const sheet = document.styleSheets[i];
          if (sheet.href) {
            const href = sheet.href.startsWith('http') ? sheet.href : origin + (sheet.href.startsWith('/') ? sheet.href : '/' + sheet.href);
            stylesheets.push(`<link rel="stylesheet" href="${href}">`);
          }
        }
      }

      // 2. Include all inline <style> tags (e.g. from InvoicePreview component)
      document.querySelectorAll('style').forEach((style) => {
        const html = (style as HTMLStyleElement).outerHTML;
        if (html && !seenCss.has(html.substring(0, 80))) {
          seenCss.add(html.substring(0, 80));
          stylesheets.push(html);
        }
      });

      const printDocument = `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice ${invoice.invoiceNumber}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="${origin}/">
    ${stylesheets.join('\n')}
    <style>
      * { box-sizing: border-box; }
      html, body { padding: 0; margin: 0; background: white; color: #000; height: auto; overflow: auto; font-family: system-ui, -apple-system, sans-serif; }
      @media print {
        html, body { overflow: visible !important; height: auto !important; }
        @page {
          margin: 0.5cm;
          size: A4;
        }
        /* Force footer to render consistently in the print engine */
        .invoice-footer {
          position: fixed !important;
          /* Pin to the physical bottom edge (inside @page margin) */
          bottom: 0.5cm !important;
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
          visibility: visible !important;
          opacity: 1 !important;
        }
        .invoice-footer p,
        .invoice-footer div,
        .invoice-footer span,
        .invoice-footer svg {
          display: inline-block !important;
          color: #374151 !important;
        }
        .invoice-footer .text-center {
          text-align: center !important;
        }
        /* Some Tailwind builds may not include .text-center in the print window;
           explicitly center the "Thanks for your business!" line. */
        .invoice-footer .thanks-line {
          display: block !important;
          text-align: center !important;
          width: 100% !important;
        }
        .invoice-footer .flex {
          display: flex !important;
        }
        .invoice-content {
          /* Reserve space so content never overlaps the pinned footer */
          padding-bottom: 220px !important;
        }
        /* Prevent awkward page breaks */
        .invoice-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .invoice-section-title {
          page-break-after: avoid;
          break-after: avoid;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      }
    </style>
  </head>
  <body>
    ${invoiceOuterHTML}
    <script>
      (function waitThenPrint() {
        if (document.readyState !== 'complete') {
          window.addEventListener('load', waitThenPrint);
          return;
        }
        // Allow styles (including any link stylesheets) to apply so PDF matches the app
        setTimeout(function() { window.print(); }, 400);
      })();
    </script>
  </body>
</html>`;

      printWindow.document.open();
      printWindow.document.write(printDocument);
      printWindow.document.close();

      alert('Print dialog will open. Select \"Save as PDF\" as the destination to download the invoice as a PDF.');
    } catch (err) {
      console.error('PDF generation failed:', err);
      window.print();
      alert('Print dialog will open. Select \"Save as PDF\" as the destination to download the invoice as a PDF.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice not found</h2>
          <Link
            href="/dashboard/invoices"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      pageTitle={`Invoice ${invoice.invoiceNumber}`}
      pageDescription={`View invoice details for ${invoice.client.name}`}
      actionButton={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/dashboard/invoices"
            className="relative group px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-400 flex items-center gap-1.5 hover:scale-105 text-xs sm:text-sm min-h-[44px]"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Invoices</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <button
            onClick={handlePrint}
            className="relative group px-3 sm:px-4 py-2 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 hover:from-gray-100 hover:via-gray-200 hover:to-gray-300 text-gray-800 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-1.5 print:hidden transform hover:-translate-y-0.5 border border-gray-300/50 text-xs sm:text-sm min-h-[44px]"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="relative group px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1.5 print:hidden transform hover:-translate-y-0.5 overflow-hidden text-xs sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            {generatingPDF ? (
              <>
                <svg className="relative z-10 w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="relative z-10">Generating…</span>
              </>
            ) : (
              <>
                <svg className="relative z-10 w-4 h-4 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="relative z-10">Download PDF</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="w-full max-w-4xl mx-auto mb-4 flex flex-wrap items-center gap-3 print:hidden min-w-0">
        {!editingInvoiceNumber ? (
          <>
            <span className="text-gray-600">Invoice #</span>
            <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
            <button
              type="button"
              onClick={() => {
                setInvoiceNumberDraft(invoice.invoiceNumber);
                setEditingInvoiceNumber(true);
              }}
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
            >
              Edit number
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={invoiceNumberDraft}
              onChange={(e) => setInvoiceNumberDraft(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
              placeholder="e.g. INV-2025-00001"
              onKeyDown={(e) => e.key === 'Enter' && saveInvoiceNumber()}
            />
            <button
              type="button"
              onClick={saveInvoiceNumber}
              disabled={savingNumber || !invoiceNumberDraft.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {savingNumber ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditingInvoiceNumber(false)}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cancel
            </button>
          </>
        )}
      </div>
      <div className="print:p-0 w-full max-w-4xl mx-auto bg-white min-w-0 overflow-x-auto" ref={invoicePreviewRef}>
        <InvoicePreview
          company={invoice.company}
          client={invoice.client}
          invoiceNumber={invoice.invoiceNumber}
          issueDate={invoice.issueDate}
          dueDate={invoice.dueDate}
          items={invoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
          }))}
          notes={invoice.notes}
          terms={invoice.terms}
          bankAccounts={bankAccounts}
        />
      </div>
    </DashboardLayout>
  );
}

