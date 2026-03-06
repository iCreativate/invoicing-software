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
  companyId?: string;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  vatNumber: string;
  logo: string;
  currency: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [bankAccountForm, setBankAccountForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    swiftCode: '',
    type: 'checking',
    isActive: true,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    taxNumber: '',
    vatNumber: '',
    currency: 'ZAR',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    if (parsedUser.companyId) {
      fetchCompany(parsedUser.companyId);
      fetchBankAccounts();
    }
  }, [router]);

  const fetchCompany = async (companyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/companies/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompany(data.data);
          setFormData({
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
            city: data.data.city || '',
            province: data.data.province || '',
            postalCode: data.data.postalCode || '',
            country: data.data.country || '',
            taxNumber: data.data.taxNumber || '',
            vatNumber: data.data.vatNumber || '',
            currency: data.data.currency || 'ZAR',
          });
          if (data.data.logo) {
            setLogoPreview(data.data.logo);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/banking/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBankAccounts(data.data?.accounts || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  };

  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingAccount
        ? `${API_BASE}/api/banking/accounts/${editingAccount}`
        : `${API_BASE}/api/banking/accounts`;
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankAccountForm),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingAccount ? 'Bank account updated successfully!' : 'Bank account added successfully!');
        setShowAddBankAccount(false);
        setEditingAccount(null);
        setBankAccountForm({
          accountName: '',
          accountNumber: '',
          bankName: '',
          branchCode: '',
          swiftCode: '',
          type: 'checking',
          isActive: true,
        });
        fetchBankAccounts();
      } else {
        alert(data.error?.message || 'Failed to save bank account');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/banking/accounts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Bank account deleted successfully!');
        fetchBankAccounts();
      } else {
        alert(data.error?.message || 'Failed to delete bank account');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEditBankAccount = (account: any) => {
    setEditingAccount(account.id);
    setBankAccountForm({
      accountName: account.accountName || '',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      branchCode: account.branchCode || '',
      swiftCode: account.swiftCode || '',
      type: account.type || 'checking',
      isActive: account.isActive !== false,
    });
    setShowAddBankAccount(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/companies/${company?.id}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && company) {
          setCompany({ ...company, logo: data.data.logo });
        }
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/companies/${company?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Company details updated successfully!');
        if (data.data) {
          setCompany(data.data);
        }
      } else {
        alert(data.error?.message || 'Failed to update company details');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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

  if (!company) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Timely
                  </h1>
                </div>
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Found</h2>
            <p className="text-gray-600 mb-6">Please contact your administrator to set up your company.</p>
            <Link
              href="/dashboard"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      pageTitle="Company Settings"
      pageDescription="Manage your company information and branding"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="glass p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200/50 min-w-0 max-w-full">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Company Logo</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain" />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">Recommended: PNG or JPG, max 2MB. Logo will appear on invoices.</p>
                </div>
              </div>
            </div>

        {/* Company Information */}
        <div className="glass p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200/50 min-w-0 max-w-full">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Number</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">VAT Number</label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  >
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
              </div>
            </div>

        {/* Banking Information */}
        <div className="glass p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200/50 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-w-0">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Banking Information</h3>
              <p className="text-sm text-gray-600 mt-1">Bank accounts will appear on invoices for payment</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddBankAccount(true);
                setEditingAccount(null);
                setBankAccountForm({
                  accountName: '',
                  accountNumber: '',
                  bankName: '',
                  branchCode: '',
                  swiftCode: '',
                  type: 'checking',
                  isActive: true,
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Bank Account
            </button>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-gray-600 font-medium">No bank accounts added yet</p>
              <p className="text-sm text-gray-500 mt-1">Add your first bank account to display on invoices</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-6 bg-white rounded-xl border-2 border-gray-200/50 hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{account.bankName}</h4>
                          <p className="text-sm text-gray-600">{account.accountName}</p>
                        </div>
                        {account.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 font-semibold">Account Number:</span>
                          <p className="text-gray-900 font-mono">{account.accountNumber}</p>
                        </div>
                        {account.branchCode && (
                          <div>
                            <span className="text-gray-600 font-semibold">Branch Code:</span>
                            <p className="text-gray-900">{account.branchCode}</p>
                          </div>
                        )}
                        {account.swiftCode && (
                          <div>
                            <span className="text-gray-600 font-semibold">SWIFT Code:</span>
                            <p className="text-gray-900">{account.swiftCode}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600 font-semibold">Type:</span>
                          <p className="text-gray-900 capitalize">{account.type}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleEditBankAccount(account)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBankAccount(account.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 glass hover:glass-strong text-gray-700 rounded-xl font-bold transition-all duration-200 border border-gray-200/50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Add/Edit Bank Account Modal */}
      {showAddBankAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddBankAccount(false);
              setEditingAccount(null);
            }
          }}
        >
          <div
            className="glass rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn mx-2 sm:mx-0 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-6 min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-gradient truncate min-w-0">
                  {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBankAccount(false);
                    setEditingAccount(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBankAccountSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccountForm.bankName}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="e.g., Standard Bank"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccountForm.accountName}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="e.g., Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccountForm.accountNumber}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none font-mono"
                      placeholder="1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                    <select
                      value={bankAccountForm.type}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, type: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Code</label>
                    <input
                      type="text"
                      value={bankAccountForm.branchCode}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, branchCode: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="e.g., 000205"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SWIFT Code</label>
                    <input
                      type="text"
                      value={bankAccountForm.swiftCode}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, swiftCode: e.target.value })}
                      className="w-full px-4 py-3 glass border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                      placeholder="e.g., SBZAZAJJ"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bankAccountForm.isActive}
                        onChange={(e) => setBankAccountForm({ ...bankAccountForm, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">Active (will appear on invoices)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBankAccount(false);
                      setEditingAccount(null);
                    }}
                    className="px-6 py-3 glass text-gray-700 hover:text-gray-900 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingAccount ? 'Update Account' : 'Add Account'}
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

