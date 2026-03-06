'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import { API_BASE } from '@/app/config';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setStatsError(null);
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/invoices/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
          setStatsError(null);
        } else {
          setStatsError('Could not load stats. The server returned an error.');
        }
      } else {
        setStatsError(
          response.status >= 500
            ? 'Server error. Ensure the backend is running and the database is connected.'
            : 'Could not load stats.'
        );
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStatsError('Cannot reach the server. Ensure the backend is running and try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      pageTitle="Dashboard"
      pageDescription={
        <span className="flex items-center gap-2">
          Welcome back, <span className="font-black text-gradient">{user.firstName}</span>!
          <svg className="w-6 h-6 text-yellow-500 animate-float" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-2a1 1 0 10-2 0 1 1 0 002 0zm-.464 5.232a3 3 0 01-4.592 0c-.304-.324-.481-.79-.481-1.291a1 1 0 011.942-.486 1 1 0 00.954.687c.334 0 .65-.16.85-.447a1 1 0 011.779.988c-.077.43-.295.83-.597 1.15z" clipRule="evenodd" />
          </svg>
        </span>
      }
      actionButton={
        <div className="hidden md:flex items-center gap-2">
          <div className="px-5 py-3 glass rounded-2xl shadow-sm border border-gray-200/50">
            <div className="text-xs text-gray-500 font-bold mb-1">Today</div>
            <div className="text-base font-black text-gradient">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-full min-w-0">
      {statsError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{statsError}</p>
          <button
            type="button"
            onClick={() => setStatsError(null)}
            className="shrink-0 p-1 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7 mb-10 min-w-0 max-w-full">
        <div className="glass p-7 rounded-3xl shadow-xl card-hover group relative overflow-hidden border border-gray-200/50 animate-scaleIn">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl -mr-20 -mt-20 animate-blob"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Invoiced</div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl animate-glow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-2">
                  R {stats.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 font-bold">All time revenue</div>
              </div>
            </div>

        <div className="glass p-7 rounded-3xl shadow-xl card-hover group relative overflow-hidden border border-gray-200/50 animate-scaleIn animation-delay-100">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full blur-3xl -mr-20 -mt-20 animate-blob animation-delay-2000"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Paid</div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                  R {stats.paid.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 font-bold">Successfully collected</div>
              </div>
            </div>

        <div className="glass p-7 rounded-3xl shadow-xl card-hover group relative overflow-hidden border border-gray-200/50 animate-scaleIn animation-delay-200">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full blur-3xl -mr-20 -mt-20 animate-blob animation-delay-4000"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Pending</div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-2">
                  R {stats.pending.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 font-bold">Awaiting payment</div>
              </div>
            </div>

        <div className="glass p-7 rounded-3xl shadow-xl card-hover group relative overflow-hidden border border-gray-200/50 animate-scaleIn animation-delay-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-full blur-3xl -mr-20 -mt-20 animate-blob"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Overdue</div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 via-red-600 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-2">
                  R {stats.overdue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 font-bold">Requires attention</div>
              </div>
            </div>
          </div>

      {/* Quick Actions */}
      <div className="glass p-6 sm:p-10 rounded-3xl shadow-xl border border-gray-200/50 animate-fadeIn min-w-0 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 min-w-0">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gradient break-words">Quick Actions</h3>
              <div className="hidden md:flex items-center gap-3 text-sm font-bold">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-float">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-gray-600">Get started quickly</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-w-0">
              <Link
                href="/dashboard/invoices/new"
                className="group relative block p-8 glass border-2 border-dashed border-gray-300/50 hover:border-blue-500 rounded-3xl transition-all duration-500 text-center card-hover overflow-hidden shimmer-effect"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                  <div className="font-black text-gray-900 text-xl mb-2 group-hover:text-gradient transition-all">Create Invoice</div>
                  <div className="text-base text-gray-500 font-semibold">Generate a new invoice</div>
                </div>
              </Link>
              <Link
                href="/dashboard/clients/new"
                className="group relative block p-8 glass border-2 border-dashed border-gray-300/50 hover:border-purple-500 rounded-3xl transition-all duration-500 text-center card-hover overflow-hidden shimmer-effect"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                  <div className="font-black text-gray-900 text-xl mb-2 group-hover:text-gradient transition-all">Add Client</div>
                  <div className="text-base text-gray-500 font-semibold">Add a new client</div>
                </div>
              </Link>
              <Link
                href="/dashboard/payroll/new"
                className="group relative block p-8 glass border-2 border-dashed border-gray-300/50 hover:border-green-500 rounded-3xl transition-all duration-500 text-center card-hover overflow-hidden shimmer-effect"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-emerald-500 rounded-3xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute inset-0 bg-white rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                  <div className="font-black text-gray-900 text-xl mb-2 group-hover:text-gradient transition-all">Process Payroll</div>
                  <div className="text-base text-gray-500 font-semibold">Run payroll processing</div>
                </div>
              </Link>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
