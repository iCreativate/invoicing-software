'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { API_BASE } from '@/app/config';

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
  email: string;
  phone: string;
  totalInvoices: number;
  totalRevenue: number;
  status: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchClients();
  }, [router]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Backend returns { success: true, data: { clients: [...] } }
          // So we need to access data.data.clients
          const clientsData = data.data?.clients || (Array.isArray(data.data) ? data.data : []);
          setClients(clientsData);
        } else {
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize filtered clients to avoid recalculating on every render
  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    if (!debouncedSearchTerm.trim()) return clients;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  }, [clients, debouncedSearchTerm]);

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
      pageTitle="Clients"
      pageDescription="Manage your client relationships"
      actionButton={
        <Link
          href="/dashboard/clients/new"
          className="relative group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden shimmer-effect"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </Link>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center animate-scaleIn card-hover">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 mb-6">Start building your client base</p>
          <Link
            href="/dashboard/clients/new"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Add Client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="glass p-6 rounded-3xl shadow-xl border border-gray-200/50 card-hover group min-w-0 overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4 gap-3 min-w-0">
                <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {client.status}
                </span>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 break-words min-w-0">{client.name}</h3>
              <div className="space-y-2 mb-4 min-w-0">
                {client.email && (
                  <div className="flex items-center text-sm text-gray-600 min-w-0 break-all">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600 min-w-0">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="break-all">{client.phone}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Invoices</div>
                  <div className="text-lg font-bold text-gray-900">{client.totalInvoices || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Revenue</div>
                  <div className="text-lg font-bold text-green-600">R {client.totalRevenue?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex-1 text-center px-4 py-2 glass hover:glass-strong text-gray-700 rounded-xl font-semibold transition-all duration-200 border border-gray-200/50"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/clients/${client.id}/edit`}
                  className="flex-1 text-center px-4 py-2 glass hover:glass-strong text-blue-700 rounded-xl font-semibold transition-all duration-200 border border-blue-200/50"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
