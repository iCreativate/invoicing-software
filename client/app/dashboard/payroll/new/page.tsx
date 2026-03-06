'use client';

import { API_BASE } from '@/app/config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

function getMonthStartEnd(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function ProcessPayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [payDate, setPayDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchEmployeeCount();
  }, [router]);

  const fetchEmployeeCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.data || [];
        const active = Array.isArray(list) ? list.filter((e: { status?: string }) => e.status === 'active') : [];
        setEmployeeCount(active.length);
      }
    } catch {
      setEmployeeCount(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!payPeriodStart || !payPeriodEnd || !payDate) {
      setError('Please fill in pay period and pay date.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/payroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payPeriodStart,
          payPeriodEnd,
          payDate,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        router.push('/dashboard/payroll');
        return;
      }
      setError(data.message || 'Failed to process payroll. Please try again.');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const setPreset = (preset: 'thisMonth' | 'lastMonth' | 'firstHalf' | 'secondHalf') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (preset === 'thisMonth') {
      const { start, end } = getMonthStartEnd(now.getFullYear(), now.getMonth());
      setPayPeriodStart(start);
      setPayPeriodEnd(end);
      setPayDate(today);
    } else if (preset === 'lastMonth') {
      const { start, end } = getMonthStartEnd(now.getFullYear(), now.getMonth() - 1);
      setPayPeriodStart(start);
      setPayPeriodEnd(end);
      setPayDate(end);
    } else if (preset === 'firstHalf') {
      const { start } = getMonthStartEnd(now.getFullYear(), now.getMonth());
      const end = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0];
      setPayPeriodStart(start);
      setPayPeriodEnd(end);
      setPayDate(end);
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 16).toISOString().split('T')[0];
      const { end } = getMonthStartEnd(now.getFullYear(), now.getMonth());
      setPayPeriodStart(start);
      setPayPeriodEnd(end);
      setPayDate(today);
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
      pageTitle="Process Payroll"
      pageDescription="Run payroll for a pay period"
      actionButton={
        <Link
          href="/dashboard/payroll"
          className="relative group px-6 py-3 glass border border-gray-200/50 text-gray-700 rounded-2xl font-bold transition-all duration-300 hover:glass-strong flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Payroll
        </Link>
      }
    >
      <div className="glass rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-8 w-full max-w-xl mx-auto animate-scaleIn min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Run payroll</h2>
        {employeeCount !== null && (
          <p className="text-sm text-gray-600 mb-6">
            <span className="font-semibold text-green-600">{employeeCount}</span> active employee{employeeCount !== 1 ? 's' : ''} will be included in this run.
          </p>
        )}
        {employeeCount === 0 && (
          <p className="text-sm text-amber-600 mb-4">
            Add active employees first. <Link href="/dashboard/employees" className="underline font-semibold">Go to Employees</Link>
          </p>
        )}

        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPreset('thisMonth')} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all">
              This month
            </button>
            <button type="button" onClick={() => setPreset('lastMonth')} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all">
              Last month
            </button>
            <button type="button" onClick={() => setPreset('firstHalf')} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all">
              1st–15th
            </button>
            <button type="button" onClick={() => setPreset('secondHalf')} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-all">
              16th–month end
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="payPeriodStart" className="block text-sm font-semibold text-gray-700 mb-2">
              Pay period start
            </label>
            <input
              id="payPeriodStart"
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="payPeriodEnd" className="block text-sm font-semibold text-gray-700 mb-2">
              Pay period end
            </label>
            <input
              id="payPeriodEnd"
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="payDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Pay date
            </label>
            <input
              id="payDate"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing…' : 'Process Payroll'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
