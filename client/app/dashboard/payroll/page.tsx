'use client';

import { useEffect, useState, useMemo } from 'react';
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

interface Payroll {
  id: string;
  payrollNumber: string;
  employeeName: string;
  employeeId?: string;
  payPeriod?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  payDate: string;
  grossSalary: number;
  netSalary: number;
  allowances?: number;
  deductions?: number;
  paye?: number;
  uif?: number;
  sdl?: number;
  status: string;
  createdAt?: string;
}

export default function PayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'payDate' | 'employeeName' | 'netSalary'>('payDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchPayrolls();
  }, [router]);

  const fetchPayrolls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/payroll', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const list = Array.isArray(data.data) ? data.data : [];
          setPayrolls(list.map((p: Payroll) => ({
            ...p,
            payDate: typeof p.payDate === 'string' ? p.payDate : (p.payDate ? new Date(p.payDate).toISOString().split('T')[0] : ''),
            payPeriod: p.payPeriod || (p.payPeriodStart && p.payPeriodEnd
              ? `${new Date(p.payPeriodStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(p.payPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : ''),
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/payroll/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchPayrolls();
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = () => {
    const headers = ['Payroll #', 'Employee', 'Pay Period', 'Pay Date', 'Gross', 'Net', 'Status'];
    const rows = filteredPayrolls.map((p) => [
      p.payrollNumber,
      p.employeeName ?? '',
      p.payPeriod ?? '',
      formatPayDate(p.payDate),
      (p.grossSalary ?? 0).toLocaleString(),
      (p.netSalary ?? 0).toLocaleString(),
      p.status,
    ]);
    const escape = (v: string) => (v.includes(',') || v.includes('"') ? `"${String(v).replace(/"/g, '""')}"` : v);
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map((c) => escape(String(c))).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      approved: 'bg-purple-100 text-purple-700 border-purple-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || colors.draft;
  };

  const filteredByStatus = filter === 'all'
    ? payrolls
    : payrolls.filter((p) => p.status === filter);

  const filteredPayrolls = useMemo(() => {
    let list = filteredByStatus;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.employeeName?.toLowerCase().includes(q) ||
          p.payrollNumber?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      list = list.filter((p) => p.payDate >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((p) => p.payDate <= dateTo);
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'payDate') {
        cmp = (a.payDate || '').localeCompare(b.payDate || '');
      } else if (sortBy === 'employeeName') {
        cmp = (a.employeeName || '').localeCompare(b.employeeName || '');
      } else {
        cmp = (a.netSalary ?? 0) - (b.netSalary ?? 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredByStatus, searchTerm, dateFrom, dateTo, sortBy, sortDir]);

  const stats = useMemo(() => {
    const totalNet = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalGross = payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const now = new Date();
    const thisMonth = payrolls.filter(
      (p) => p.payDate && new Date(p.payDate).getMonth() === now.getMonth() && new Date(p.payDate).getFullYear() === now.getFullYear()
    );
    const thisMonthNet = thisMonth.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const draftCount = payrolls.filter((p) => p.status === 'draft').length;
    const paidCount = payrolls.filter((p) => p.status === 'paid').length;
    const uniqueEmployees = new Set(payrolls.map((p) => p.employeeId || p.employeeName)).size;
    return {
      totalNet,
      totalGross,
      thisMonthNet,
      draftCount,
      paidCount,
      recordCount: payrolls.length,
      uniqueEmployees,
    };
  }, [payrolls]);

  const formatPayDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
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
      pageTitle="Payroll"
      pageDescription="Manage employee payroll and payments"
      actionButton={
        <Link
          href="/dashboard/payroll/new"
          className="relative group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden shimmer-effect"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Process Payroll
        </Link>
      }
    >
      <div className="w-full max-w-full min-w-0 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total paid out</div>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              R {stats.totalNet.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">All time net</div>
          </div>
          <div className="glass p-5 rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">This month</div>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              R {stats.thisMonthNet.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">Net pay this month</div>
          </div>
          <div className="glass p-5 rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Records</div>
            <div className="text-2xl font-black text-gray-900">{stats.recordCount}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.draftCount} draft · {stats.paidCount} paid</div>
          </div>
          <div className="glass p-5 rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employees</div>
            <div className="text-2xl font-black text-gray-900">{stats.uniqueEmployees}</div>
            <div className="text-xs text-gray-500 mt-1">In payroll history</div>
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by employee or payroll #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 glass border border-gray-200/50 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <span className="text-gray-500">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear dates
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <label className="text-sm font-semibold text-gray-600">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'payDate' | 'employeeName' | 'netSalary')}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="payDate">Pay date</option>
              <option value="employeeName">Employee</option>
              <option value="netSalary">Net pay</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              )}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredPayrolls.length === 0}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 animate-slideIn">
          {['all', 'draft', 'processing', 'approved', 'paid', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'glass text-gray-700 hover:glass-strong hover:scale-105 border border-gray-200/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Payroll table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center animate-scaleIn card-hover">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No payroll records found</h3>
            <p className="text-gray-600 mb-6">
              {payrolls.length === 0
                ? 'Start processing your first payroll'
                : 'Try changing filters or search'}
            </p>
            {payrolls.length === 0 && (
              <Link
                href="/dashboard/payroll/new"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Process Payroll
              </Link>
            )}
          </div>
        ) : (
          <div className="glass rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden animate-scaleIn min-w-0 max-w-full">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100/80 to-gray-50/80 border-b-2 border-gray-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payroll #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pay Period</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Gross</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Net</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pay Date</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-white/40 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{payroll.payrollNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{payroll.employeeName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 text-sm">{payroll.payPeriod || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">R {(payroll.grossSalary ?? 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">R {(payroll.netSalary ?? 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(payroll.status)}`}>
                          {payroll.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{formatPayDate(payroll.payDate)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {payroll.status === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatus(payroll.id, 'paid')}
                                disabled={updatingId === payroll.id}
                                className="p-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all shadow-sm hover:shadow-md glass disabled:opacity-60"
                                title="Mark as paid"
                              >
                                {updatingId === payroll.id ? (
                                  <span className="w-5 h-5 block border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(payroll.id, 'cancelled')}
                                disabled={updatingId === payroll.id}
                                className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all shadow-sm hover:shadow-md glass disabled:opacity-60"
                                title="Cancel"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </>
                          )}
                          <Link
                            href={`/dashboard/payroll/${payroll.id}`}
                            className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass"
                            title="View details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            href="/dashboard/employees"
                            className="p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-110 glass"
                            title="Employees"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
