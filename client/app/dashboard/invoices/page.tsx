'use client';

import { API_BASE } from '@/app/config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  status: string;
  dueDate: string;
  issueDate: string;
  paidAmount?: number;
  balanceAmount?: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchInvoices();
  }, [router]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Handle both response formats: data.data.invoices or data.data (array)
          const invoicesData = data.data?.invoices || (Array.isArray(data.data) ? data.data : []);
          
          // Transform invoice data to match the expected interface
          const transformedInvoices = invoicesData.map((invoice: any) => {
            const paidAmount = invoice.paidAmount || invoice.paid_amount || 0;
            const totalAmount = invoice.totalAmount || invoice.total_amount || 0;
            const balanceAmount = invoice.balanceAmount || invoice.balance_amount || totalAmount;
            
            // Determine display status: sent invoices should show as pending if not paid
            let displayStatus = invoice.status || 'draft';
            if (displayStatus === 'sent' && paidAmount === 0) {
              displayStatus = 'pending'; // Show sent invoices as pending
            } else if (displayStatus === 'sent' && paidAmount > 0 && paidAmount < totalAmount) {
              displayStatus = 'partial';
            } else if (displayStatus === 'sent' && paidAmount >= totalAmount) {
              displayStatus = 'paid';
            }
            
            return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || '',
            clientName: invoice.client?.name || invoice.clientName || 'Unknown Client',
              totalAmount: totalAmount,
              status: displayStatus,
              paidAmount: paidAmount,
              balanceAmount: balanceAmount,
            dueDate: invoice.dueDate 
              ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : invoice.due_date 
                ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
            issueDate: invoice.issueDate
              ? new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : invoice.issue_date
                ? new Date(invoice.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
            };
          });
          
          setInvoices(transformedInvoices);
        } else {
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      overdue: 'bg-red-100 text-red-700 border-red-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      sent: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[status] || colors.draft;
  };

  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  
  const filteredInvoices = filter === 'all'
    ? invoicesArray
    : filter === 'pending'
    ? invoicesArray.filter(inv => inv.status === 'pending' || inv.status === 'sent')
    : invoicesArray.filter(inv => inv.status === filter);

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
      pageTitle="Invoices"
      pageDescription="Manage and track all your invoices with ease"
      actionButton={
        <Link
          href="/dashboard/invoices/new"
          className="relative group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden shimmer-effect"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <svg className="relative z-10 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative z-10">New Invoice</span>
        </Link>
      }
    >
      <div className="w-full max-w-full min-w-0">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-slideIn">
        {['all', 'draft', 'sent', 'pending', 'paid', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${filter === status
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                : 'glass text-gray-700 hover:glass-strong hover:scale-105 border border-gray-200/50'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center animate-scaleIn card-hover">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gradient mb-3">No invoices found</h3>
          <p className="text-gray-600 text-lg mb-8 font-medium">Get started by creating your first invoice</p>
          <Link
            href="/dashboard/invoices/new"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Create Invoice
          </Link>
        </div>
      ) : (
        <div className="glass rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden animate-scaleIn min-w-0 max-w-full">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100/80 to-gray-50/80 border-b-2 border-gray-200/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Due Date</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/40 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-black text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-500 font-medium">{invoice.issueDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{invoice.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">R {invoice.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border-2 shadow-sm ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                        {/* Payment Status Indicator */}
                        {invoice.paidAmount !== undefined && invoice.totalAmount > 0 && (
                          <div className="flex items-center gap-1.5">
                            {invoice.paidAmount >= invoice.totalAmount ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Paid
                              </span>
                            ) : invoice.paidAmount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Partial
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Unpaid
                      </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-semibold">{invoice.dueDate}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass"
                          title="View Invoice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboard/invoices/${invoice.id}/edit`}
                          className="p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass"
                          title="Edit Invoice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
