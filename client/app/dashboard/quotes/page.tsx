'use client';

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

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  totalAmount: number;
  status: string;
  expiryDate: string;
  issueDate: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
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
    fetchQuotes();
  }, [router]);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5001/api/quotes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const quotesData = data.data?.quotes || (Array.isArray(data.data) ? data.data : []);
          
          const transformedQuotes = quotesData.map((quote: any) => ({
            id: quote.id,
            quoteNumber: quote.quoteNumber || quote.quote_number || '',
            clientName: quote.client?.name || quote.clientName || 'Unknown Client',
            totalAmount: quote.totalAmount || quote.total_amount || 0,
            status: quote.status || 'draft',
            expiryDate: quote.expiryDate 
              ? new Date(quote.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : quote.expiry_date 
                ? new Date(quote.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
            issueDate: quote.issueDate
              ? new Date(quote.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : quote.issue_date
                ? new Date(quote.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '',
          }));
          
          setQuotes(transformedQuotes);
        } else {
          setQuotes([]);
        }
      } else {
        // Handle non-OK responses
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        setQuotes([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch quotes:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Cannot connect to the server. Please ensure the backend server is running on http://localhost:5001');
      }
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      accepted: 'bg-green-100 text-green-700 border-green-200',
      sent: 'bg-blue-100 text-blue-700 border-blue-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      expired: 'bg-orange-100 text-orange-700 border-orange-200',
      viewed: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return colors[status] || colors.draft;
  };

  const quotesArray = Array.isArray(quotes) ? quotes : [];
  
  const filteredQuotes = filter === 'all'
    ? quotesArray
    : quotesArray.filter(q => q.status === filter);

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
      pageTitle="Quotes"
      pageDescription="Manage and track all your quotes with ease"
      actionButton={
        <Link
          href="/dashboard/quotes/new"
          className="relative group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden shimmer-effect"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <svg className="relative z-10 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative z-10">New Quote</span>
        </Link>
      }
    >
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-slideIn">
        {['all', 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'].map((status) => (
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

      {/* Quotes Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredQuotes.length === 0 && quotes.length === 0 ? (
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center animate-scaleIn card-hover">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gradient mb-3">No quotes found</h3>
          <p className="text-gray-600 text-lg mb-8 font-medium">Get started by creating your first quote</p>
          <Link
            href="/dashboard/quotes/new"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Create Quote
          </Link>
        </div>
      ) : (
        <div className="glass rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden animate-scaleIn min-w-0 max-w-full">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100/80 to-gray-50/80 border-b-2 border-gray-200/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Quote #</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-widest">Expiry Date</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-white/40 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-black text-gray-900">{quote.quoteNumber}</div>
                      <div className="text-sm text-gray-500 font-medium">{quote.issueDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{quote.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">R {quote.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border-2 shadow-sm ${getStatusColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-semibold">{quote.expiryDate}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/quotes/${quote.id}`}
                          className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass"
                          title="View Quote"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboard/quotes/${quote.id}/edit`}
                          className="p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass"
                          title="Edit Quote"
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
    </DashboardLayout>
  );
}

