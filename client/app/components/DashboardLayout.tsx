'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  pageTitle: string;
  pageDescription?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export default function DashboardLayout({
  children,
  user,
  pageTitle,
  pageDescription,
  actionButton,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Prevent the outer page (browser) from scrolling; only <main> should scroll.
  useEffect(() => {
    document.body.classList.add('dashboard-scroll-lock');
    return () => document.body.classList.remove('dashboard-scroll-lock');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (path: string) => {
    // Exact match
    if (pathname === path) return true;
    // For nested routes like /dashboard/invoices/new, match parent /dashboard/invoices
    // But don't match /dashboard with /dashboard/invoices (only exact match for /dashboard)
    if (path !== '/dashboard' && pathname.startsWith(path + '/')) return true;
    return false;
  };

  return (
    <div className="flex flex-col min-h-screen h-screen w-full max-w-full overflow-hidden relative bg-white" data-responsive-fill data-dashboard-layout>
      {/* Background Ambient Effects - Subtle for white theme */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-50 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-50 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-50 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="glass border-b border-gray-200/50 shadow-sm z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%' }}>
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl glass border border-gray-200/50 hover:glass-strong transition-all"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 animate-glow">
                  <span className="text-white font-bold text-lg sm:text-xl">T</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-gradient truncate">
                    Timely
                  </h1>
                  <p className="text-xs text-gray-500 font-medium -mt-1 hidden sm:block truncate">Finance & Operations Platform</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-3 px-5 py-2.5 glass rounded-2xl border border-gray-200/50 shadow-sm">
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden group">
                  {user.firstName[0]}{user.lastName[0]}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize font-medium">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="relative group px-5 py-2.5 text-gray-700 font-bold rounded-xl transition-all duration-300 overflow-hidden glass hover:bg-red-50 border border-gray-200/50 hover:border-red-200"
              >
                <span className="relative z-10 group-hover:text-red-600 hidden sm:inline">Logout</span>
                <svg className="relative z-10 w-5 h-5 sm:hidden group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] glass p-6 border-r border-gray-200/50 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm font-bold text-gray-700">Menu</div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2" onClick={() => setMobileSidebarOpen(false)}>
              {/* Reuse the same links as desktop */}
              <Link
                href="/dashboard"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard')
                    ? 'text-blue-600 bg-blue-50 border-blue-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-blue-600 bg-transparent hover:bg-blue-50 border-transparent hover:border-blue-200'
                }`}
              >
                <span className="relative z-10">Dashboard</span>
              </Link>
              <Link
                href="/dashboard/invoices"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/invoices')
                    ? 'text-blue-600 bg-blue-50 border-blue-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-blue-600 bg-transparent hover:bg-blue-50 border-transparent hover:border-blue-200'
                }`}
              >
                <span className="relative z-10">Invoices</span>
              </Link>
              <Link
                href="/dashboard/quotes"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/quotes')
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-indigo-600 bg-transparent hover:bg-indigo-50 border-transparent hover:border-indigo-200'
                }`}
              >
                <span className="relative z-10">Quotes</span>
              </Link>
              <Link
                href="/dashboard/clients"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/clients')
                    ? 'text-purple-600 bg-purple-50 border-purple-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-purple-600 bg-transparent hover:bg-purple-50 border-transparent hover:border-purple-200'
                }`}
              >
                <span className="relative z-10">Clients</span>
              </Link>
              <Link
                href="/dashboard/payroll"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/payroll')
                    ? 'text-green-600 bg-green-50 border-green-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-green-600 bg-transparent hover:bg-green-50 border-transparent hover:border-green-200'
                }`}
              >
                <span className="relative z-10">Payroll</span>
              </Link>
              <Link
                href="/dashboard/employees"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/employees')
                    ? 'text-cyan-600 bg-cyan-50 border-cyan-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-cyan-600 bg-transparent hover:bg-cyan-50 border-transparent hover:border-cyan-200'
                }`}
              >
                <span className="relative z-10">Employees</span>
              </Link>
              <Link
                href="/dashboard/accounting"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/accounting')
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-indigo-600 bg-transparent hover:bg-indigo-50 border-transparent hover:border-indigo-200'
                }`}
              >
                <span className="relative z-10">Accounting</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                  isActive('/dashboard/settings')
                    ? 'text-gray-900 bg-gray-50 border-gray-300 font-bold shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-gray-50 border-transparent hover:border-gray-300'
                }`}
              >
                <span className="relative z-10">Settings</span>
              </Link>
            </nav>
          </aside>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:block w-72 glass overflow-y-auto p-6 border-r border-gray-200/50 shadow-sm z-40" style={{ position: 'fixed', left: 0, top: '5rem', bottom: 0, height: 'calc(100vh - 5rem)' }}>
          <nav className="space-y-2">
            <div className="mb-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                Main Menu
              </h3>
            </div>
            <Link
              href="/dashboard"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard')
                  ? 'text-blue-600 bg-blue-50 border-blue-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-blue-600 bg-transparent hover:bg-blue-50 border-transparent hover:border-blue-200'
              }`}
            >
              {isActive('/dashboard') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="relative z-10">Dashboard</span>
            </Link>
            <Link
              href="/dashboard/invoices"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/invoices')
                  ? 'text-blue-600 bg-blue-50 border-blue-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-blue-600 bg-transparent hover:bg-blue-50 border-transparent hover:border-blue-200'
              }`}
            >
              {isActive('/dashboard/invoices') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/invoices')
                  ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/invoices') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Invoices
            </Link>
            <Link
              href="/dashboard/quotes"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/quotes')
                  ? 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-indigo-600 bg-transparent hover:bg-indigo-50 border-transparent hover:border-indigo-200'
              }`}
            >
              {isActive('/dashboard/quotes') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/quotes')
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/quotes') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Quotes
            </Link>
            <Link
              href="/dashboard/clients"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/clients')
                  ? 'text-purple-600 bg-purple-50 border-purple-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-purple-600 bg-transparent hover:bg-purple-50 border-transparent hover:border-purple-200'
              }`}
            >
              {isActive('/dashboard/clients') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-pink-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/clients')
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/clients') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              Clients
            </Link>
            <Link
              href="/dashboard/payroll"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/payroll')
                  ? 'text-green-600 bg-green-50 border-green-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-green-600 bg-transparent hover:bg-green-50 border-transparent hover:border-green-200'
              }`}
            >
              {isActive('/dashboard/payroll') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/payroll')
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-green-500 group-hover:to-emerald-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/payroll') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Payroll
            </Link>
            <Link
              href="/dashboard/employees"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/employees')
                  ? 'text-cyan-600 bg-cyan-50 border-cyan-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-cyan-600 bg-transparent hover:bg-cyan-50 border-transparent hover:border-cyan-200'
              }`}
            >
              {isActive('/dashboard/employees') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-600 to-blue-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/employees')
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/employees') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              Employees
            </Link>
            <Link
              href="/dashboard/accounting"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/accounting')
                  ? 'text-indigo-600 bg-indigo-50 border-indigo-200 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-indigo-600 bg-transparent hover:bg-indigo-50 border-transparent hover:border-indigo-200'
              }`}
            >
              {isActive('/dashboard/accounting') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/accounting')
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-500'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/accounting') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              Accounting
            </Link>
            <Link
              href="/dashboard/settings"
              className={`relative flex items-center px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group border shimmer-effect ${
                isActive('/dashboard/settings')
                  ? 'text-gray-900 bg-gray-50 border-gray-300 font-bold shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-gray-50 border-transparent hover:border-gray-300'
              }`}
            >
              {isActive('/dashboard/settings') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-600 to-gray-800 rounded-r-full"></div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${
                isActive('/dashboard/settings')
                  ? 'bg-gradient-to-br from-gray-600 to-gray-800'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-gray-600 group-hover:to-gray-800'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  isActive('/dashboard/settings') ? 'text-white' : 'text-gray-600 group-hover:text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              Settings
            </Link>
          </nav>
      </aside>

      {/* Main Content - fills viewport when full, resizes when browser is smaller */}
      <main
        className="dashboard-main-scroll flex-1 flex flex-col min-h-0 w-full max-w-full pt-24 lg:ml-72 px-4 sm:px-6 lg:px-10 pb-4 sm:pb-6 lg:pb-10 overflow-x-hidden overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-w-0 min-h-0 flex-grow">
          <div className="mb-10 animate-fadeIn max-w-full w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-6 flex-wrap">
              <div className="flex-1 min-w-0 max-w-full w-full sm:min-w-[200px]">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 min-w-0">
                  <div className="h-1.5 w-12 sm:w-16 flex-shrink-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full shadow-lg"></div>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-tight leading-tight break-words min-w-0 max-w-full">
                    {pageTitle}
                  </h2>
                </div>
                {pageDescription && (
                  <div className="flex items-start gap-2.5 ml-0 sm:ml-20 pl-0 sm:pl-1 min-w-0 max-w-full w-full">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-base sm:text-lg font-semibold leading-relaxed break-words min-w-0 max-w-full">{pageDescription}</p>
                  </div>
                )}
              </div>
              {actionButton && (
                <div className="hidden md:flex flex-shrink-0 items-start pt-1 min-w-0 flex-wrap gap-2">
                  {actionButton}
                </div>
              )}
            </div>
            {actionButton && (
              <div className="md:hidden w-full min-w-0 max-w-full flex flex-wrap gap-2">
                {actionButton}
              </div>
            )}
          </div>
          <div className="dashboard-content-wrap flex-1 min-h-0 min-w-0 w-full">
            {children}
          </div>
        </div>
        </main>
    </div>
  );
}

