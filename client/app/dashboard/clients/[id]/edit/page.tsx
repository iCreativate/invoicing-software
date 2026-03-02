'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../../components/DashboardLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  vatNumber?: string;
  contactPerson?: string;
  isActive?: boolean;
  creditLimit?: number;
}

export default function ClientEditPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
    contactPerson: '',
    isActive: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchClient();
  }, [clientId, router]);

  const fetchClient = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Client not found.');
        } else {
          setError('Failed to load client.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data?.client) {
        const c = data.data.client as Client;
        setFormData({
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || '',
          province: c.province || '',
          postalCode: c.postalCode || '',
          country: c.country || '',
          taxNumber: c.taxNumber || '',
          vatNumber: c.vatNumber || '',
          contactPerson: c.contactPerson || '',
          isActive: c.isActive !== false,
        });
      } else {
        setError('Failed to load client.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(`/dashboard/clients/${clientId}`);
        return;
      }
      setError(data.error?.message || 'Failed to update client.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <DashboardLayout user={user} pageTitle="Edit Client" pageDescription="Update client details">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !formData.name) {
    return (
      <DashboardLayout user={user} pageTitle="Edit Client" pageDescription="Update client details">
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Link
            href="/dashboard/clients"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Back to Clients
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const fields: { key: keyof typeof formData; label: string; required?: boolean; type?: string }[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'contactPerson', label: 'Contact person' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'province', label: 'Province' },
    { key: 'postalCode', label: 'Postal code' },
    { key: 'country', label: 'Country' },
    { key: 'taxNumber', label: 'Tax number' },
    { key: 'vatNumber', label: 'VAT number' },
  ];

  return (
    <DashboardLayout
      user={user}
      pageTitle="Edit Client"
      pageDescription="Update client details"
      actionButton={
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="px-4 py-2 glass border border-gray-200/50 text-gray-700 rounded-xl font-semibold hover:glass-strong transition-all"
        >
          Back to Client
        </Link>
      }
    >
      <div className="glass rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {fields.map(({ key, label, required, type = 'text' }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                id={key}
                type={type}
                required={required}
                value={formData[key]}
                onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
              Active client
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="px-6 py-3 glass border border-gray-200/50 text-gray-700 rounded-xl font-semibold hover:glass-strong transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
