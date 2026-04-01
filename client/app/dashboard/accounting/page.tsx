'use client';

import { API_BASE } from '@/app/config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { MobileCard, MobileCardList, KeyValue, KeyValueGrid } from '../../components/MobileCardList';
import { ResponsiveTableShell } from '../../components/ResponsiveTableShell';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  account: string;
  type: string;
  amount: number;
  description: string;
}

export default function AccountingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
    fetchEntries();
  }, [router]);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/accounting/journal-entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEntries(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.type === filter);

  const totalDebits = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const totalCredits = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

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
      pageTitle="Accounting"
      pageDescription="Manage your financial records and journal entries"
      actionButton={
        <Link
          href="/dashboard/accounting/new-entry"
          className="relative group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden shimmer-effect"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Entry
        </Link>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-3xl shadow-xl border border-gray-200/50 card-hover">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Total Debits</div>
          <div className="text-3xl font-black text-red-600">R {totalDebits.toLocaleString()}</div>
        </div>
        <div className="glass p-6 rounded-3xl shadow-xl border border-gray-200/50 card-hover">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Total Credits</div>
          <div className="text-3xl font-black text-green-600">R {totalCredits.toLocaleString()}</div>
        </div>
        <div className="glass p-6 rounded-3xl shadow-xl border border-gray-200/50 card-hover">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Balance</div>
          <div className={`text-3xl font-black ${totalDebits - totalCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R {Math.abs(totalDebits - totalCredits).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-slideIn">
        {['all', 'debit', 'credit'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
              filter === type
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                : 'glass text-gray-700 hover:glass-strong hover:scale-105 border border-gray-200/50'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

            {/* Journal Entries Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
      ) : filteredEntries.length === 0 ? (
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center animate-scaleIn card-hover">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No journal entries found</h3>
          <p className="text-gray-600 mb-6">Start recording your financial transactions</p>
          <Link
            href="/dashboard/accounting/new-entry"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            New Entry
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards (< md) */}
          <div className="md:hidden">
            <MobileCardList>
              {filteredEntries.map((entry) => (
                <MobileCard key={entry.id}>
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="font-black text-gray-900 break-words">{entry.entryNumber || '—'}</div>
                      <div className="text-sm text-gray-500 font-medium">{entry.account || '—'}</div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm flex-shrink-0 ${
                        entry.type === 'debit'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {entry.type || '—'}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-gray-700 break-words">{entry.description || '—'}</div>

                  <KeyValueGrid>
                    <KeyValue label="Date" value={entry.entryDate || '—'} />
                    <KeyValue
                      label="Amount"
                      value={
                        entry.type === 'debit' ? (
                          <span className="font-black text-red-600">R {entry.amount.toLocaleString()}</span>
                        ) : (
                          <span className="font-black text-green-600">R {entry.amount.toLocaleString()}</span>
                        )
                      }
                    />
                  </KeyValueGrid>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="flex-1 min-w-[120px] text-center px-4 py-2.5 glass hover:glass-strong text-gray-700 rounded-xl font-semibold transition-all duration-200 border border-gray-200/50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="flex-1 min-w-[120px] text-center px-4 py-2.5 glass hover:glass-strong text-blue-700 rounded-xl font-semibold transition-all duration-200 border border-blue-200/50"
                    >
                      Edit
                    </button>
                  </div>
                </MobileCard>
              ))}
            </MobileCardList>
          </div>

          {/* Table (>= md) */}
          <div className="hidden md:block">
            <ResponsiveTableShell className="animate-scaleIn">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100/80 to-gray-50/80 border-b-2 border-gray-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Entry #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Debit</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Credit</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/40 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{entry.entryNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{entry.entryDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{entry.account}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700">{entry.description}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {entry.type === 'debit' && (
                          <div className="font-bold text-red-600">R {entry.amount.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {entry.type === 'credit' && (
                          <div className="font-bold text-green-600">R {entry.amount.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableShell>
          </div>
        </>
            )}
    </DashboardLayout>
  );
}

