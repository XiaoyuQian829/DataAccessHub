'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  user: string;
  timestamp: string;
  ip_address: string;
  user_agent?: string;
  details?: string;
  status: 'success' | 'failed' | 'warning';
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Mock audit log data for demonstration
      const mockLogs: AuditLog[] = [
        {
          id: 1,
          action: 'LOGIN',
          resource_type: 'User',
          user: 'xqian',
          timestamp: '2024-01-15T10:30:00Z',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'success'
        },
        {
          id: 2,
          action: 'CREATE_REQUEST',
          resource_type: 'ApprovalRequest',
          resource_id: 123,
          user: 'xqian',
          timestamp: '2024-01-15T10:35:00Z',
          ip_address: '192.168.1.100',
          details: 'Data access request for Customer Data',
          status: 'success'
        },
        {
          id: 3,
          action: 'APPROVE_REQUEST',
          resource_type: 'ApprovalRequest',
          resource_id: 122,
          user: 'admin',
          timestamp: '2024-01-15T09:45:00Z',
          ip_address: '192.168.1.50',
          details: 'Approved data access request',
          status: 'success'
        },
        {
          id: 4,
          action: 'FAILED_LOGIN',
          resource_type: 'User',
          user: 'unknown_user',
          timestamp: '2024-01-15T09:20:00Z',
          ip_address: '192.168.1.200',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: 'Invalid credentials',
          status: 'failed'
        },
        {
          id: 5,
          action: 'UPDATE_PERMISSIONS',
          resource_type: 'User',
          resource_id: 456,
          user: 'admin',
          timestamp: '2024-01-14T16:30:00Z',
          ip_address: '192.168.1.50',
          details: 'Updated user role permissions',
          status: 'success'
        },
        {
          id: 6,
          action: 'DELETE_DATASET',
          resource_type: 'Dataset',
          resource_id: 789,
          user: 'admin',
          timestamp: '2024-01-14T14:15:00Z',
          ip_address: '192.168.1.50',
          details: 'Deleted inactive dataset',
          status: 'warning'
        },
        {
          id: 7,
          action: 'VIEW_SENSITIVE_DATA',
          resource_type: 'Dataset',
          resource_id: 101,
          user: 'researcher01',
          timestamp: '2024-01-14T11:20:00Z',
          ip_address: '192.168.1.120',
          details: 'Accessed financial reports dataset',
          status: 'success'
        },
        {
          id: 8,
          action: 'EXPORT_DATA',
          resource_type: 'Dataset',
          resource_id: 102,
          user: 'analyst_user',
          timestamp: '2024-01-13T15:45:00Z',
          ip_address: '192.168.1.150',
          details: 'Exported customer analytics data',
          status: 'success'
        }
      ];
      
      // Apply filters
      let filteredLogs = mockLogs;
      
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(filters.action.toLowerCase())
        );
      }
      
      if (filters.user) {
        filteredLogs = filteredLogs.filter(log => 
          log.user.toLowerCase().includes(filters.user.toLowerCase())
        );
      }
      
      if (filters.status) {
        filteredLogs = filteredLogs.filter(log => log.status === filters.status);
      }
      
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      user: '',
      dateFrom: '',
      dateTo: '',
      status: ''
    });
  };

  return (
    <ProtectedRoute requiredRoles={['Administrator']}>
      <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Audit Logs
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Monitor system activities and user actions for security and compliance
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="btn-secondary">
                  Export Logs
                </button>
                <button className="btn-primary">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {logs.length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Events
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-green-600">
                    {logs.filter(log => log.status === 'success').length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Successful
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-red-600">
                    {logs.filter(log => log.status === 'failed').length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Failed
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-yellow-600">
                    {logs.filter(log => log.status === 'warning').length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Warnings
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Filter Logs
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <input
                  type="text"
                  id="action"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="mt-1 form-input"
                  placeholder="e.g., LOGIN, CREATE"
                />
              </div>
              
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                  User
                </label>
                <input
                  type="text"
                  id="user"
                  name="user"
                  value={filters.user}
                  onChange={handleFilterChange}
                  className="mt-1 form-input"
                  placeholder="Username"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                  From Date
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="mt-1 form-input"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Activity Log
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading audit logs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.action.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.resource_type}
                          {log.resource_id && (
                            <span className="text-gray-400"> #{log.resource_id}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.ip_address}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate" title={log.details}>
                            {log.details || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No audit logs found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No activities match your current filters.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Security & Compliance
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Audit logs are automatically generated for all system activities and are retained for compliance purposes. 
                  These logs help maintain security, track user activities, and support forensic investigations when needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Layout>
    </ProtectedRoute>
  );
}