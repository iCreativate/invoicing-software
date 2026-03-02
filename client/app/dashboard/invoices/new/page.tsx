'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import InvoicePreview from '../../../components/InvoicePreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

interface Company {
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
  currency?: string;
}

const invoiceTemplates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and professional design with gradient accents',
    preview: 'modern-preview',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional invoice layout',
    preview: 'classic-preview',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant',
    preview: 'minimal-preview',
  },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
  });
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [
      { description: '', quantity: 1, unitPrice: 0, taxRate: 0, lineTotal: 0 }
    ],
    notes: '',
    terms: '',
    disclaimer: '',
    template: 'modern',
  });
  const [invoiceColors, setInvoiceColors] = useState({
    primary: '#2563eb', // blue-600
    secondary: '#9333ea', // purple-600
    accent: '#3b82f6', // blue-500
  });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [generatingTerms, setGeneratingTerms] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPreview]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchClients();
    if (parsedUser.companyId) {
      fetchCompany(parsedUser.companyId);
      fetchBankAccounts(parsedUser.companyId);
    }
  }, [router]);

  const fetchCompany = async (companyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/companies/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompany(data.data);
          // Auto-generate disclaimer based on company name
          if (data.data.name && !formData.disclaimer) {
            const autoDisclaimer = `This invoice is issued by ${data.data.name}. All amounts are in ${data.data.currency || 'ZAR'}. Payment is due within the terms specified. ${data.data.name} reserves the right to charge interest on overdue amounts.`;
            setFormData(prev => ({ ...prev, disclaimer: autoDisclaimer }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const fetchBankAccounts = async (companyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/banking/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Handle different response formats
          const accounts = data.data?.accounts || data.data?.bankAccounts || (Array.isArray(data.data) ? data.data : []);
          // Filter only active bank accounts
          const activeAccounts = accounts.filter((acc: any) => acc.isActive !== false);
          setBankAccounts(activeAccounts);
        }
      }
    } catch (error) {
      // Silently fail if banking endpoint doesn't exist yet
      console.log('Bank accounts endpoint not available yet');
      setBankAccounts([]);
    }
  };

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Backend returns { success: true, data: { clients: [...] } }
          // So we need to access data.data.clients
          const clientsData = data.data?.clients || (Array.isArray(data.data) ? data.data : []);
          setClients(clientsData);
        } else {
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
    }
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newClient.name.trim()) {
      alert('Client name is required');
      return;
    }

    setCreatingClient(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to create a client');
        setCreatingClient(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        alert(`Server error: ${response.status} ${response.statusText}. Please check the server logs.`);
        setCreatingClient(false);
        return;
      }

      if (response.ok && data.success) {
        // Refresh clients list
        await fetchClients();
        // Auto-select the newly created client
        setFormData({ ...formData, clientId: data.data.client.id });
        // Reset form and close modal
        setNewClient({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          country: '',
        });
        setShowAddClientModal(false);
      } else {
        const errorMessage = data.error?.message || data.message || `Failed to create client (${response.status})`;
        console.error('Client creation error:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          requestBody: newClient
        });
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Cannot connect to the server. Please make sure:\n1. The backend server is running on http://localhost:5001\n2. There are no firewall or network issues');
      } else {
        const errorMessage = error.message || 'An error occurred. Please try again.';
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setCreatingClient(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, lineTotal: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate line total
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = updatedItems[index];
      const subtotal = item.quantity * item.unitPrice;
      const tax = subtotal * (item.taxRate / 100);
      updatedItems[index].lineTotal = subtotal + tax;
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + itemSubtotal;
    }, 0);
    
    const taxAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * (item.taxRate / 100));
    }, 0);
    
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };
  }, [formData.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const totals = calculateTotals;
      
      const invoiceData = {
        clientId: formData.clientId,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.total,
        notes: formData.notes,
        terms: formData.terms,
        disclaimer: formData.disclaimer,
        template: selectedTemplate,
        colors: invoiceColors,
      };

      const response = await fetch('http://localhost:5001/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/invoices');
      } else {
        alert(data.error?.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoice(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        router.push('/login');
        setSendingInvoice(false);
        return;
      }

      const response = await fetch(`http://localhost:5001/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to send invoice (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        alert(errorMessage);
        setSendingInvoice(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert('Invoice sent successfully to client!');
        router.push('/dashboard/invoices');
      } else {
        alert(data.error?.message || 'Failed to send invoice');
        setSendingInvoice(false);
      }
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Cannot connect to the server. Please ensure:\n1. The backend server is running on http://localhost:5001\n2. Run "npm run dev" from the project root directory');
      } else {
        alert(`An error occurred while sending the invoice: ${error.message || 'Unknown error'}`);
      }
      setSendingInvoice(false);
    }
  };

  const handleGenerateTerms = async () => {
    // Get companyId from company or user as fallback
    const companyId = company?.id || user?.companyId;
    
    if (!companyId) {
      alert('Please set up your company information first.');
      return;
    }

    setGeneratingTerms(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to generate Terms & Conditions.');
        setGeneratingTerms(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/ai/generate-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: companyId,
          clientId: formData.clientId || undefined,
          dueDate: formData.dueDate || undefined,
          totalAmount: calculateTotals.total,
          currency: company?.currency || 'ZAR',
          paymentTerms: formData.dueDate && formData.issueDate 
            ? `${Math.ceil((new Date(formData.dueDate).getTime() - new Date(formData.issueDate).getTime()) / (1000 * 60 * 60 * 24))} days`
            : undefined,
        }),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMessage = 'Failed to generate Terms & Conditions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        alert(errorMessage);
        setGeneratingTerms(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.data?.terms) {
        setFormData({ ...formData, terms: data.data.terms });
      } else {
        alert(data.error?.message || 'Failed to generate Terms & Conditions');
      }
    } catch (error: any) {
      console.error('Error generating Terms & Conditions:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Cannot connect to the server. Please ensure:\n1. The backend server is running on http://localhost:5001\n2. Run "npm run dev" from the project root directory');
      } else {
        alert(`An error occurred while generating Terms & Conditions: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setGeneratingTerms(false);
    }
  };

  // Get selected client details for preview - memoized
  const selectedClient = useMemo(() => {
    return Array.isArray(clients) ? clients.find(c => c.id === formData.clientId) : undefined;
  }, [clients, formData.clientId]);

  // Generate preview invoice number - memoized
  const previewInvoiceNumber = useMemo(() => {
    const year = new Date().getFullYear();
    return `INV-${year}-00001`;
  }, []);

  // Generate PDF from invoice preview using browser print (more reliable)
  const handleSaveAsPDF = async () => {
    if (!invoicePreviewRef.current) {
      alert('Invoice preview not available');
      return;
    }

    if (!company || !selectedClient) {
      alert('Please ensure company and client information is loaded');
      return;
    }

    setGeneratingPDF(true);

    try {
      const element = invoicePreviewRef.current;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to generate PDF');
        setGeneratingPDF(false);
        return;
      }

      // Get the HTML content directly - this ensures all content including footer is included
      const invoiceHTML = element.innerHTML;
      
      // Verify footer is in the HTML (for debugging)
      if (!invoiceHTML.includes('invoice-footer') || !invoiceHTML.includes('Thanks for your business')) {
        console.warn('Footer content not found in invoice HTML');
      }
      
      // Get all stylesheets from the current document
      const stylesheets: string[] = [];
      
      // Get all link stylesheets
      const linkStylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      linkStylesheets.forEach((link: Element) => {
        const href = (link as HTMLLinkElement).href;
        if (href) {
          stylesheets.push(`<link rel="stylesheet" href="${href}">`);
        }
      });
      
      // Get all style tags
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach((style: Element) => {
        stylesheets.push(style.outerHTML);
      });
      
      // Try to get stylesheet rules
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          if (!sheet.href) {
            // Inline stylesheet - try to get rules
            const rules = sheet.cssRules || (sheet as any).rules;
            if (rules && rules.length > 0) {
              let cssText = '';
              for (let j = 0; j < rules.length; j++) {
                cssText += rules[j].cssText + '\n';
              }
              if (cssText && !stylesheets.some(s => s.includes(cssText.substring(0, 50)))) {
                stylesheets.push(`<style>${cssText}</style>`);
              }
            }
          }
        } catch (e) {
          // Skip stylesheets that can't be accessed (CORS or security)
        }
      }
      
      // Create a print-friendly HTML document with all styles
      const printDocument = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${previewInvoiceNumber}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${stylesheets.join('\n')}
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 20px;
                background: white;
                margin: 0;
                color: #000;
              }
              .invoice-container {
                width: 210mm; /* A4 width */
                min-height: 297mm; /* A4 height */
                margin: 0 auto;
                padding: 20mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
              }
              @media print {
                body {
                  padding: 0;
                }
                @page {
                  margin: 0.5cm;
                  margin-bottom: 180px; /* Space for footer (Thanks message + contact info + decorative lines) */
                  size: A4;
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
                .invoice-footer span,
                .invoice-footer svg {
                  display: inline-block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  color: #374151 !important;
                }
                .invoice-footer .text-center {
                  text-align: center !important;
                }
                .invoice-footer .flex {
                  display: flex !important;
                }
                .invoice-content {
                  padding-bottom: 200px !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${invoiceHTML}
            </div>
            <script>
              window.onload = function() {
                // Wait for styles to load
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    setTimeout(function() {
                      window.close();
                    }, 100);
                  };
                }, 200);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printDocument);
      printWindow.document.close();
      
      // Show instructions
      alert('Print dialog will open. Select "Save as PDF" as the destination to save the invoice as a PDF file.');
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error?.message || 'Unknown error'}. Please try using the browser's print function (Ctrl+P / Cmd+P) instead.`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      pageTitle="Create New Invoice"
      pageDescription="Fill in the details to create a new invoice"
      actionButton={
            <Link
              href="/dashboard/invoices"
          className="relative group px-6 py-3 glass text-gray-700 hover:text-blue-600 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200/50 flex items-center gap-2"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
          <span>Back</span>
            </Link>
      }
    >

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selection */}
        <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Invoice Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {invoiceTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setFormData({ ...formData, template: template.id });
                    }}
                    className={`p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg scale-105'
                        : 'border-gray-200/50 hover:border-blue-300 hover:glass-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{template.name}</span>
                      {selectedTemplate === template.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="mt-4 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-gray-500 font-semibold">{template.name} Preview</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Customization */}
            <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Invoice Colors</h3>
              <p className="text-sm text-gray-600 mb-6">Customize the colors to match your company branding</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={invoiceColors.primary}
                      onChange={(e) => setInvoiceColors({ ...invoiceColors, primary: e.target.value })}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
                      style={{ backgroundColor: invoiceColors.primary }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={invoiceColors.primary}
                        onChange={(e) => setInvoiceColors({ ...invoiceColors, primary: e.target.value })}
                        className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none font-mono text-sm"
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={invoiceColors.secondary}
                      onChange={(e) => setInvoiceColors({ ...invoiceColors, secondary: e.target.value })}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
                      style={{ backgroundColor: invoiceColors.secondary }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={invoiceColors.secondary}
                        onChange={(e) => setInvoiceColors({ ...invoiceColors, secondary: e.target.value })}
                        className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none font-mono text-sm"
                        placeholder="#9333ea"
                      />
                    </div>
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={invoiceColors.accent}
                      onChange={(e) => setInvoiceColors({ ...invoiceColors, accent: e.target.value })}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
                      style={{ backgroundColor: invoiceColors.accent }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={invoiceColors.accent}
                        onChange={(e) => setInvoiceColors({ ...invoiceColors, accent: e.target.value })}
                        className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none font-mono text-sm"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 rounded-xl border-2 border-gray-200/50 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">Color Preview</p>
                <div className="flex gap-2">
                  <div 
                    className="h-12 flex-1 rounded-lg shadow-sm"
                    style={{ backgroundColor: invoiceColors.primary }}
                  ></div>
                  <div 
                    className="h-12 flex-1 rounded-lg shadow-sm"
                    style={{ backgroundColor: invoiceColors.secondary }}
                  ></div>
                  <div 
                    className="h-12 flex-1 rounded-lg shadow-sm"
                    style={{ backgroundColor: invoiceColors.accent }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Company Information Preview */}
            {company && (
          <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Company Information</h3>
                <div className="flex items-start gap-6">
                  {company.logo && (
                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      <img src={`http://localhost:5001${company.logo}`} alt={company.name} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{company.name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {company.address && <div>{company.address}</div>}
                      {(company.city || company.province || company.postalCode) && (
                        <div>
                          {company.city}{company.city && company.province ? ', ' : ''}
                          {company.province} {company.postalCode}
                        </div>
                      )}
                      {company.country && <div>{company.country}</div>}
                      {company.email && <div>{company.email}</div>}
                      {company.phone && <div>{company.phone}</div>}
                      {company.taxNumber && <div>Tax: {company.taxNumber}</div>}
                      {company.vatNumber && <div>VAT: {company.vatNumber}</div>}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-all duration-200 text-sm"
                  >
                    Edit Company Info
                  </Link>
                </div>
              </div>
            )}

        <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Invoice Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="flex-1 px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                    <button
                      type="button"
                      onClick={() => setShowAddClientModal(true)}
                      className="px-4 py-3 glass border-2 border-gray-200/50 rounded-xl hover:glass-strong hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-200 font-semibold flex items-center gap-2 whitespace-nowrap"
                      title="Add New Client"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
        <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 glass text-gray-700 hover:text-blue-600 hover:glass-strong rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border border-gray-200/50 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 glass border-2 border-gray-200/50 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                          placeholder="Item description"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 glass border-2 border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm text-gray-600">Line Total: </span>
                      <span className="font-bold text-gray-900">
                        R {((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
        <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
              <div className="flex justify-end">
                <div className="w-full md:w-96 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-bold">R {calculateTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="font-semibold">Tax:</span>
                    <span className="font-bold">R {calculateTotals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-3 border-t-2 border-gray-200 flex justify-between">
                    <span className="text-xl font-black text-gray-900">Total:</span>
                    <span className="text-xl font-black text-blue-600">R {calculateTotals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
        <div className="glass p-8 rounded-3xl shadow-xl border border-gray-200/50 animate-scaleIn">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Additional Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    placeholder="Additional notes for the client..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Terms & Conditions</label>
                    <button
                      type="button"
                      onClick={handleGenerateTerms}
                      disabled={generatingTerms}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingTerms ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Auto-generate
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    placeholder="Payment terms and conditions... Click 'Auto-generate' to create professional terms."
                  />
                  <p className="text-xs text-gray-500 mt-1">Terms & Conditions will be generated based on your company details and invoice information</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Disclaimer</label>
                    <button
                      type="button"
                      onClick={() => {
                        const companyName = company?.name || 'the company';
                        const currency = company?.currency || 'ZAR';
                        const autoDisclaimer = `This invoice is issued by ${companyName}. All amounts are in ${currency}. Payment is due within the terms specified. ${companyName} reserves the right to charge interest on overdue amounts.`;
                          setFormData({ ...formData, disclaimer: autoDisclaimer });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Auto-generate
                    </button>
                  </div>
                  <textarea
                    value={formData.disclaimer}
                    onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    placeholder="Disclaimer will be auto-generated based on company name..."
                  />
                  <p className="text-xs text-gray-500 mt-1">This disclaimer will appear at the bottom of the invoice</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={async () => {
                  // Ensure company is loaded before showing preview
                  const cid = user?.companyId;
                  if (!company && cid) await fetchCompany(cid);
                  setShowPreview(true);
                }}
                disabled={!formData.clientId || !formData.items.some(item => item.description)}
                className="px-6 py-3 glass text-gray-700 hover:text-blue-600 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview Invoice
              </button>
              <div className="flex items-center gap-4">
              <Link
                href="/dashboard/invoices"
            className="px-6 py-3 glass text-gray-700 hover:text-gray-900 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200/50"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('Save & Send button clicked');
                  
                  // Validate required fields
                  if (!formData.clientId) {
                    alert('Please select a client');
                    return;
                  }
                  
                  if (!formData.items.some(item => item.description)) {
                    alert('Please add at least one invoice item with a description');
                    return;
                  }
                  
                  setLoading(true);
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      alert('Authentication required. Please log in again.');
                      router.push('/login');
                      setLoading(false);
                      return;
                    }
                    
                    const totals = calculateTotals;
                    
                    const invoiceData = {
                      clientId: formData.clientId,
                      issueDate: formData.issueDate,
                      dueDate: formData.dueDate,
                      items: formData.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                      })),
                      subtotal: totals.subtotal,
                      taxAmount: totals.taxAmount,
                      totalAmount: totals.total,
                      notes: formData.notes,
                      terms: formData.terms,
                      disclaimer: formData.disclaimer,
                      template: selectedTemplate,
                      colors: invoiceColors,
                    };
                    
                    console.log('Creating invoice with data:', invoiceData);

                    const response = await fetch('http://localhost:5001/api/invoices', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(invoiceData),
                    });

                    if (!response.ok) {
                      let errorMessage = `Failed to create invoice (${response.status})`;
                      try {
                        const errorData = await response.json();
                        errorMessage = errorData.error?.message || errorData.message || errorMessage;
                      } catch (jsonError) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                      }
                      alert(errorMessage);
                      setLoading(false);
                      return;
                    }

                    const data = await response.json();

                    if (data.success) {
                      const invoiceId = data.data?.invoice?.id;
                      if (invoiceId) {
                        await handleSendInvoice(invoiceId);
                      } else {
                        alert('Invoice created but could not get invoice ID. Please try sending it manually.');
                        setLoading(false);
                        router.push('/dashboard/invoices');
                      }
                    } else {
                      alert(data.error?.message || 'Failed to create invoice');
                      setLoading(false);
                    }
                  } catch (error: any) {
                    console.error('Error creating invoice:', error);
                    if (error.name === 'TypeError' && error.message.includes('fetch')) {
                      alert('Cannot connect to the server. Please ensure:\n1. The backend server is running on http://localhost:5001\n2. Run "npm run dev" from the project root directory');
                    } else {
                      alert(`An error occurred while creating the invoice: ${error.message || 'Unknown error'}`);
                    }
                    setLoading(false);
                  }
                }}
                disabled={loading || sendingInvoice}
                className="relative group px-8 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden shimmer-effect"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                {sendingInvoice ? (
                  <>
                    <svg className="relative z-10 animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="relative z-10">Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="relative z-10 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Save & Send</span>
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={loading || sendingInvoice}
            className="relative group px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden shimmer-effect"
              >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                {loading ? (
                  <>
                <svg className="relative z-10 animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                <span className="relative z-10">Creating...</span>
                  </>
                ) : (
                  <>
                <svg className="relative z-10 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                <span className="relative z-10">Create Invoice</span>
                  </>
                )}
              </button>
              </div>
            </div>
          </form>

          {/* Preview Invoice Modal */}
          {showPreview && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
              onClick={(e) => {
                // Close modal when clicking backdrop
                if (e.target === e.currentTarget) {
                  setShowPreview(false);
                }
              }}
            >
              <div 
                className="glass rounded-3xl shadow-2xl border border-gray-200/50 max-w-5xl w-full animate-scaleIn flex flex-col"
                style={{ maxHeight: 'calc(100vh - 4rem)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-shrink-0 p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-gradient">Invoice Preview</h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveAsPDF}
                        disabled={generatingPDF || !company || !selectedClient}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {generatingPDF ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Save as PDF
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 px-8 pb-8 overflow-y-auto">
                  <div className="bg-white rounded-2xl p-6" ref={invoicePreviewRef}>
                    {company && selectedClient && formData.items.some(item => item.description) ? (
                <InvoicePreview
                  company={company}
                  client={{
                    name: selectedClient.name,
                    email: selectedClient.email,
                  }}
                  invoiceNumber={previewInvoiceNumber}
                  issueDate={formData.issueDate}
                  dueDate={formData.dueDate}
                  items={formData.items
                    .filter(item => item.description)
                    .map(item => ({
                      description: item.description,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      taxRate: item.taxRate,
                      total: item.quantity * item.unitPrice * (1 + item.taxRate / 100),
                    }))}
                  notes={formData.notes}
                  terms={formData.terms}
                  template={selectedTemplate}
                  colors={invoiceColors}
                  bankAccounts={bankAccounts.map(acc => ({
                    bankName: acc.bankName,
                    accountName: acc.accountName,
                    accountNumber: acc.accountNumber,
                    branchCode: acc.branchCode,
                    swiftCode: acc.swiftCode,
                    type: acc.type,
                  }))}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Incomplete Invoice Data</h4>
                        <p className="text-gray-600 mb-4">
                          {!company && user?.companyId && 'Loading company information... '}
                          {!company && !user?.companyId && 'Please set up your company information first. '}
                          {!selectedClient && 'Please select a client. '}
                          {!formData.items.some(item => item.description) && 'Please add at least one invoice item with a description.'}
                        </p>
                        {!company && user?.companyId && (
                          <button
                            onClick={async () => {
                              if (user?.companyId) await fetchCompany(user.companyId);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Retry Loading Company
                          </button>
                        )}
                        {!company && !user?.companyId && (
                          <Link
                            href="/dashboard/settings"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Go to Settings
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              setShowAddClientModal(false);
              setNewClient({
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                province: '',
                postalCode: '',
                country: '',
              });
            }
          }}
        >
          <div 
            className="glass rounded-3xl shadow-2xl border border-gray-200/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-gradient">Add New Client</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClientModal(false);
                    setNewClient({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      province: '',
                      postalCode: '',
                      country: '',
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="client@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="+27 12 345 6789"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={newClient.city}
                      onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                    <input
                      type="text"
                      value={newClient.province}
                      onChange={(e) => setNewClient({ ...newClient, province: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="Province"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={newClient.postalCode}
                      onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={newClient.country}
                      onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="South Africa"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClientModal(false);
                      setNewClient({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        city: '',
                        province: '',
                        postalCode: '',
                        country: '',
                      });
                    }}
                    className="px-6 py-3 glass text-gray-700 hover:text-gray-900 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClient || !newClient.name.trim()}
                    className="relative group px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden shimmer-effect"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {creatingClient ? (
                      <>
                        <svg className="relative z-10 animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative z-10">Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="relative z-10 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="relative z-10">Create Client</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
      </div>
    </div>
      )}
    </DashboardLayout>
  );
}

