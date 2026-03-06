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
  invoices?: unknown[];
  createdAt?: string;
}

export default function ClientViewPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const response = await fetch(`${API_BASE}/api/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Client not found.');
          setClient(null);
        } else {
          setError('Failed to load client.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data?.client) {
        setClient(data.data.client);
      } else {
        setError('Failed to load client.');
      }
    } catch {
      setError('Could not reach the server.');
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

  if (loading) {
    return (
      <DashboardLayout user={user} pageTitle="Client" pageDescription="View client details">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout user={user} pageTitle="Client" pageDescription="View client details">
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center">
          <p className="text-red-600 font-semibold mb-4">{error || 'Client not found.'}</p>
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

  const invoiceCount = Array.isArray(client.invoices) ? client.invoices.length : 0;

  return (
    <DashboardLayout
      user={user}
      pageTitle={client.name}
      pageDescription="Client details"
      actionButton={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/clients"
            className="px-4 py-2 glass border border-gray-200/50 text-gray-700 rounded-xl font-semibold hover:glass-strong transition-all"
          >
            Back to Clients
          </Link>
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Edit Client
          </Link>
        </div>
      }
    >
      <div className="glass rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden p-6 sm:p-8 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="text-2xl font-black text-gray-900 break-words">{client.name}</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  client.isActive !== false
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {client.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>

            <dl className="space-y-4">
              {client.email && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</dt>
                  <dd className="text-gray-900 font-medium break-all">{client.email}</dd>
                </div>
              )}
              {client.phone && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</dt>
                  <dd className="text-gray-900 font-medium">{client.phone}</dd>
                </div>
              )}
              {client.contactPerson && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact person</dt>
                  <dd className="text-gray-900 font-medium">{client.contactPerson}</dd>
                </div>
              )}
              {(client.address || client.city) && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</dt>
                  <dd className="text-gray-900 font-medium">
                    {[client.address, client.city, client.province, client.postalCode, client.country]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </div>
              )}
              {client.taxNumber && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tax number</dt>
                  <dd className="text-gray-900 font-medium">{client.taxNumber}</dd>
                </div>
              )}
              {client.vatNumber && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">VAT number</dt>
                  <dd className="text-gray-900 font-medium">{client.vatNumber}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoices</dt>
                <dd className="text-gray-900 font-medium">{invoiceCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
