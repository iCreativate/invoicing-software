'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/app/config';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'Admin',
      email: 'admin@timely.demo',
      password: 'demo123',
      description: 'Full access to all features',
    },
    {
      role: 'Accountant',
      email: 'accountant@timely.demo',
      password: 'demo123',
      description: 'Financial management access',
    },
    {
      role: 'Manager',
      email: 'manager@timely.demo',
      password: 'demo123',
      description: 'Team and project management',
    },
  ];

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setFormData({ email: demoEmail, password: demoPassword });
    setError('');
    setLoading(true);

    try {
      // First, ensure demo users exist
      try {
        const seedResponse = await fetch(`${API_BASE}/api/auth/seed-demo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!seedResponse.ok) {
          console.log('Seed endpoint returned non-ok status:', seedResponse.status);
        }
      } catch (seedErr: any) {
        // If seed fails due to network error, backend might not be running
        if (seedErr.name === 'TypeError' && seedErr.message.includes('fetch')) {
          throw new Error('Cannot connect to backend server. Please ensure the backend is running on port 5000.');
        }
        console.log('Seed attempt failed, continuing with login');
      }

      // Try to login
      let response: Response;
      try {
        response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: demoEmail, password: demoPassword }),
        });
      } catch (fetchError: any) {
        // Network error - backend is not reachable
        if (fetchError.name === 'TypeError' && (fetchError.message.includes('fetch') || fetchError.message.includes('Failed to fetch'))) {
          throw new Error('Cannot connect to backend server. Please ensure the backend is running on port 5000. Run "npm run dev" from the project root directory.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          const msg = errorData.error?.message || `Server error: ${response.status}`;
          if (response.status >= 500) {
            const fallback = 'Server is unavailable. Ensure the backend is running on port 5000 and the database is connected.';
            throw new Error(msg && msg !== 'Internal Server Error' ? msg : fallback);
          }
          throw new Error(msg);
        } catch (parseError: unknown) {
          if (parseError instanceof Error) throw parseError;
          throw new Error(`Server returned error ${response.status}. Please check that the backend and database are running.`);
        }
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        router.push('/dashboard');
      } else {
        setError(data.error?.message || 'Demo login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        router.push('/dashboard');
      } else {
        const msg = data.error?.message || 'Login failed';
        setError(
          response.status >= 500 || msg === 'Internal Server Error'
            ? 'Server is unavailable. Ensure the backend is running on port 5000 and the database is connected.'
            : msg
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-gradient-to-br from-blue-50 via-indigo-50 via-white to-purple-50 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-12 box-border">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 animate-fadeIn flex-shrink-0">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>

        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl sm:text-2xl">T</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Timely
            </h1>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 animate-slideIn">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-1">Connection Error</p>
                <p className="text-sm whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8">
          {/* Demo Accounts Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Try Demo Accounts</p>
            <div className="space-y-2">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className="w-full text-left px-3 sm:px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                >
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">{account.role}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold flex-shrink-0">
                          Demo
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{account.email}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 sm:line-clamp-none">{account.description}</div>
                    </div>
                    <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

