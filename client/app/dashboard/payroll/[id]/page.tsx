'use client';

import { API_BASE } from '@/app/config';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PayrollDetail {
  id: string;
  payrollNumber: string;
  employeeName: string;
  employeeNumber?: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  grossSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paye: number;
  uif: number;
  sdl: number;
  status: string;
  breakdown?: {
    earnings?: Array<{ description: string; amount: number }>;
    deductions?: Array<{ description: string; amount: number }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function PayrollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const payrollId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchPayroll();
  }, [payrollId, router]);

  const fetchPayroll = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/payroll/${payrollId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Payroll record not found.');
          setPayroll(null);
        } else {
          setError('Failed to load payroll.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setPayroll(data.data);
      } else {
        setError('Failed to load payroll.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const updateStatus = async (status: string) => {
    if (!payroll) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/payroll/${payroll.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchPayroll();
      }
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  const printPayslip = () => {
    window.print();
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

  if (loading) {
    return (
      <DashboardLayout user={user} pageTitle="Payroll" pageDescription="Payroll details">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !payroll) {
    return (
      <DashboardLayout user={user} pageTitle="Payroll" pageDescription="Payroll details">
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center">
          <p className="text-red-600 font-semibold mb-4">{error || 'Payroll not found.'}</p>
          <Link
            href="/dashboard/payroll"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Back to Payroll
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={user}
      pageTitle={payroll.payrollNumber}
      pageDescription={`${payroll.employeeName} · ${formatDate(payroll.payDate)}`}
      actionButton={
        <Link
          href="/dashboard/payroll"
          className="px-4 py-2 glass border border-gray-200/50 text-gray-700 rounded-xl font-semibold hover:glass-strong transition-all"
        >
          Back to Payroll
        </Link>
      }
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="glass rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-1">{payroll.payrollNumber}</h2>
              <p className="text-gray-600 font-medium">{payroll.employeeName}</p>
              {payroll.employeeNumber && (
                <p className="text-sm text-gray-500">Employee # {payroll.employeeNumber}</p>
              )}
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(payroll.status)}`}>
              {payroll.status}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pay period</dt>
              <dd className="text-gray-900 font-medium">
                {formatDate(payroll.payPeriodStart)} – {formatDate(payroll.payPeriodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pay date</dt>
              <dd className="text-gray-900 font-medium">{formatDate(payroll.payDate)}</dd>
            </div>
          </dl>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Gross salary</span>
              <span className="font-bold text-gray-900">R {(payroll.grossSalary ?? 0).toLocaleString()}</span>
            </div>
            {(payroll.allowances ?? 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Allowances</span>
                <span className="font-bold text-green-600">R {(payroll.allowances ?? 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>PAYE</span>
              <span>R {(payroll.paye ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>UIF</span>
              <span>R {(payroll.uif ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>SDL</span>
              <span>R {(payroll.sdl ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-semibold">Total deductions</span>
              <span className="font-bold text-red-600">R {(payroll.deductions ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
              <span className="text-gray-900 font-bold text-lg">Net pay</span>
              <span className="font-black text-xl text-green-600">R {(payroll.netSalary ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {payroll.breakdown && (payroll.breakdown.earnings?.length || payroll.breakdown.deductions?.length) ? (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Breakdown</h3>
              {payroll.breakdown.earnings && payroll.breakdown.earnings.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Earnings</div>
                  <ul className="space-y-1">
                    {payroll.breakdown.earnings.map((e, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>{e.description}</span>
                        <span>R {(e.amount ?? 0).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {payroll.breakdown.deductions && payroll.breakdown.deductions.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Deductions</div>
                  <ul className="space-y-1">
                    {payroll.breakdown.deductions.map((d, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>{d.description}</span>
                        <span>R {(d.amount ?? 0).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {payroll.status === 'draft' && (
            <button
              type="button"
              onClick={() => updateStatus('paid')}
              disabled={updating}
              className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {updating ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Mark as paid
            </button>
          )}
          <button
            type="button"
            onClick={printPayslip}
            className="px-4 py-2 glass border border-gray-200/50 text-gray-700 rounded-xl font-semibold hover:glass-strong transition-all flex items-center gap-2 print:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print payslip
          </button>
          <Link
            href="/dashboard/employees"
            className="px-4 py-2 glass border border-gray-200/50 text-gray-700 rounded-xl font-semibold hover:glass-strong transition-all print:hidden"
          >
            View employees
          </Link>
          <Link
            href="/dashboard/payroll/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all print:hidden"
          >
            Process another payroll
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
