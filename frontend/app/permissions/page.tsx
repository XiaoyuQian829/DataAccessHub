'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  is_active: boolean;
  last_login: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      if (activeTab === 'users') {
        const mockUsers: User[] = [
          {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            roles: ['Administrator', 'Data Manager'],
            is_active: true,
            last_login: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            username: 'xqian',
            email: 'xqian@example.com',
            roles: ['Data Analyst'],
            is_active: true,
            last_login: '2024-01-14T15:20:00Z'
          },
          {
            id: 3,
            username: 'researcher01',
            email: 'researcher@example.com',
            roles: ['Researcher'],
            is_active: true,
            last_login: '2024-01-13T09:45:00Z'
          },
          {
            id: 4,
            username: 'guest_user',
            email: 'guest@example.com',
            roles: ['Guest'],
            is_active: false,
            last_login: '2024-01-10T16:30:00Z'
          }
        ];
        setUsers(mockUsers);
      } else if (activeTab === 'roles') {
        const mockRoles: Role[] = [
          {
            id: 1,
            name: 'Administrator',
            description: 'Full system access and user management',
            permissions: ['USER_MANAGE', 'DATA_ACCESS', 'SYSTEM_CONFIG', 'AUDIT_VIEW'],
            user_count: 2
          },
          {
            id: 2,
            name: 'Data Manager',
            description: 'Manage datasets and approve access requests',
            permissions: ['DATA_MANAGE', 'APPROVE_REQUESTS', 'VIEW_ANALYTICS'],
            user_count: 3
          },
          {
            id: 3,
            name: 'Data Analyst',
            description: 'Access approved datasets for analysis',
            permissions: ['DATA_READ', 'REQUEST_ACCESS', 'VIEW_REPORTS'],
            user_count: 5
          },
          {
            id: 4,
            name: 'Researcher',
            description: 'Limited access for research purposes',
            permissions: ['DATA_READ', 'REQUEST_ACCESS'],
            user_count: 4
          },
          {
            id: 5,
            name: 'Guest',
            description: 'Read-only access to public data',
            permissions: ['PUBLIC_DATA_READ'],
            user_count: 2
          }
        ];
        setRoles(mockRoles);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-100 text-red-800';
      case 'Data Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Data Analyst':
        return 'bg-green-100 text-green-800';
      case 'Researcher':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <ProtectedRoute requiredRoles={['Administrator', 'Data Manager']}>
      <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Permissions Management
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Manage user roles, permissions, and access controls
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="btn-secondary">
                  Export Report
                </button>
                <button className="btn-primary">
                  Add New Role
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
                    {users.filter(u => u.is_active).length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Users
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
                  <div className="text-2xl font-bold text-gray-900">
                    {roles.length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Roles
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
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(roles.flatMap(r => r.permissions)).size}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Unique Permissions
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
                  <div className="text-2xl font-bold text-gray-900">
                    {users.reduce((total, u) => total + u.roles.length, 0)}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Role Assignments
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users & Roles
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Role Management
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'matrix'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Permission Matrix
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <h4 className="text-lg font-medium text-gray-900">
                                {user.username}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {user.email}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {user.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              Last login: {formatDate(user.last_login)}
                            </p>
                          </div>
                          <div className="ml-6 flex space-x-3">
                            <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                              Edit Roles
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <h4 className="text-lg font-medium text-gray-900">
                                {role.name}
                              </h4>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {role.user_count} users
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {role.description}
                            </p>
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Permissions:</h5>
                              <div className="flex flex-wrap gap-2">
                                {role.permissions.map((permission) => (
                                  <span
                                    key={permission}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {permission.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="ml-6 flex space-x-3">
                            <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                              Edit Role
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                              Assign Users
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Permission Matrix Tab */}
                {activeTab === 'matrix' && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                      <h4 className="text-lg font-medium text-gray-900">Permission Matrix</h4>
                      <p className="text-sm text-gray-600">Overview of role permissions</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User Manage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data Access
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              System Config
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Approve Requests
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Audit View
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {roles.map((role) => (
                            <tr key={role.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {role.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {role.permissions.includes('USER_MANAGE') ? '✅' : '❌'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {role.permissions.some(p => p.includes('DATA')) ? '✅' : '❌'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {role.permissions.includes('SYSTEM_CONFIG') ? '✅' : '❌'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {role.permissions.includes('APPROVE_REQUESTS') ? '✅' : '❌'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {role.permissions.includes('AUDIT_VIEW') ? '✅' : '❌'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </Layout>
    </ProtectedRoute>
  );
}