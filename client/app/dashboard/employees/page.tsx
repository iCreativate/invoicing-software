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
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  baseSalary: number;
  status: string;
  hireDate: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchEmployees();
  }, [router]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmployees(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      pageTitle="Employees"
      pageDescription="Manage your team members"
      actionButton={
        <Link
          href="/dashboard/employees/new"
          className="relative group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden shimmer-effect"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Link>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="glass p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center animate-scaleIn card-hover">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600 mb-6">Start building your team</p>
          <Link
            href="/dashboard/employees/new"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Add Employee
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="glass p-6 rounded-3xl shadow-xl border border-gray-200/50 card-hover group min-w-0 overflow-hidden"
            >
                    <div className="flex items-start justify-between mb-4 gap-3 min-w-0">
                      <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : employee.status === 'on_leave'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {employee.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1 break-words min-w-0">{employee.firstName} {employee.lastName}</h3>
                    <div className="text-sm text-gray-500 mb-4 truncate min-w-0">{employee.employeeNumber}</div>
                    <div className="space-y-2 mb-4 min-w-0">
                      {employee.position && (
                        <div className="flex items-center text-sm text-gray-600 min-w-0">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{employee.position}</span>
                        </div>
                      )}
                      {employee.department && (
                        <div className="flex items-center text-sm text-gray-600 min-w-0">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{employee.department}</span>
                        </div>
                      )}
                      {employee.email && (
                        <div className="flex items-center text-sm text-gray-600 min-w-0 break-all">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Base Salary</div>
                          <div className="text-lg font-bold text-gray-900">R {employee.baseSalary?.toLocaleString() || 0}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Hired: {employee.hireDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/dashboard/employees/${employee.id}`}
                        className="flex-1 text-center px-4 py-2 glass hover:glass-strong text-gray-700 rounded-xl font-semibold transition-all duration-200 border border-gray-200/50"
                      >
                        View
                      </Link>
                      <button className="flex-1 px-4 py-2 glass hover:glass-strong text-blue-700 rounded-xl font-semibold transition-all duration-200 border border-blue-200/50">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
    </DashboardLayout>
  );
}

