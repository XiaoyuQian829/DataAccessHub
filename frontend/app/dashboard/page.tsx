'use client';

import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Role-based stats
  const getRoleBasedStats = () => {
    if (!user?.roles?.length) return [];

    const userRole = user.roles[0];
    
    switch (userRole) {
      case 'Administrator':
        return [
          { name: 'Pending Approvals', value: '12', change: '+2', changeType: 'increase' },
          { name: 'Active Datasets', value: '45', change: '+5', changeType: 'increase' },
          { name: 'User Permissions', value: '128', change: '-3', changeType: 'decrease' },
          { name: 'Audit Events Today', value: '89', change: '+12', changeType: 'increase' },
        ];
      case 'Data Manager':
        return [
          { name: 'Pending Approvals', value: '8', change: '+1', changeType: 'increase' },
          { name: 'Managed Datasets', value: '23', change: '+3', changeType: 'increase' },
          { name: 'Approved Requests', value: '45', change: '+5', changeType: 'increase' },
          { name: 'Team Members', value: '12', change: '0', changeType: 'neutral' },
        ];
      case 'Data Analyst':
        return [
          { name: 'My Requests', value: '5', change: '+1', changeType: 'increase' },
          { name: 'Accessible Datasets', value: '15', change: '+2', changeType: 'increase' },
          { name: 'Completed Analysis', value: '28', change: '+4', changeType: 'increase' },
          { name: 'Reports Generated', value: '12', change: '+2', changeType: 'increase' },
        ];
      case 'Researcher':
        return [
          { name: 'My Requests', value: '3', change: '+1', changeType: 'increase' },
          { name: 'Accessible Datasets', value: '8', change: '+1', changeType: 'increase' },
          { name: 'Research Projects', value: '2', change: '0', changeType: 'neutral' },
          { name: 'Publications', value: '4', change: '+1', changeType: 'increase' },
        ];
      default: // Guest
        return [
          { name: 'Available Datasets', value: '5', change: '0', changeType: 'neutral' },
          { name: 'Public Reports', value: '18', change: '+2', changeType: 'increase' },
          { name: 'Documentation', value: '25', change: '+1', changeType: 'increase' },
          { name: 'Tutorials', value: '12', change: '0', changeType: 'neutral' },
        ];
    }
  };

  const stats = getRoleBasedStats();

  const recentActivity = [
    {
      id: 1,
      type: 'approval',
      message: 'New approval request submitted by John Doe',
      time: '2 hours ago',
      status: 'pending',
    },
    {
      id: 2,
      type: 'dataset',
      message: 'Dataset "Customer Data" updated by Jane Smith',
      time: '4 hours ago',
      status: 'completed',
    },
    {
      id: 3,
      type: 'permission',
      message: 'Permission granted to user "researcher01"',
      time: '6 hours ago',
      status: 'completed',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.first_name || user?.username}!
                </h2>
                <p className="text-gray-600">
                  Here's your {user?.roles?.[0]} dashboard overview.
                </p>
              </div>
              {user?.roles && user.roles.length > 0 && (
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {user.roles[0]}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Current Role</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd>
                        <div className="flex items-baseline">
                          <div
                            className={`text-sm font-semibold ${
                              stat.changeType === 'increase'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {stat.change}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm text-gray-600">
                            from last week
                          </div>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest updates and activities in your system.
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <li key={activity.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            activity.status === 'pending'
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                          }`}
                        />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Actions available to all roles except Guest */}
              {user?.roles?.[0] !== 'Guest' && (
                <Link
                  href="/approvals/new"
                  className="btn-primary text-center inline-block"
                >
                  Submit New Request
                </Link>
              )}
              
              {/* Actions for Administrator, Data Manager, Data Analyst, Researcher */}
              {authService.hasAnyRole(user, ['Administrator', 'Data Manager', 'Data Analyst', 'Researcher']) && (
                <Link
                  href="/approvals"
                  className="btn-secondary text-center inline-block"
                >
                  View My Requests
                </Link>
              )}
              
              {/* Actions for Administrator, Data Manager, Data Analyst */}
              {authService.hasAnyRole(user, ['Administrator', 'Data Manager', 'Data Analyst']) && (
                <Link
                  href="/datasets"
                  className="btn-secondary text-center inline-block"
                >
                  Browse Datasets
                </Link>
              )}
              
              {/* Admin-only actions */}
              {authService.hasRole(user, 'Administrator') && (
                <>
                  <Link
                    href="/permissions"
                    className="btn-secondary text-center inline-block"
                  >
                    Manage Permissions
                  </Link>
                  <Link
                    href="/audit"
                    className="btn-secondary text-center inline-block"
                  >
                    View Audit Logs
                  </Link>
                </>
              )}
              
              {/* Data Manager actions */}
              {authService.hasRole(user, 'Data Manager') && (
                <Link
                  href="/permissions"
                  className="btn-secondary text-center inline-block"
                >
                  Team Permissions
                </Link>
              )}
              
              {/* Guest actions */}
              {authService.hasRole(user, 'Guest') && (
                <>
                  <Link
                    href="/datasets"
                    className="btn-secondary text-center inline-block"
                  >
                    Browse Public Data
                  </Link>
                  <button
                    onClick={() => alert('Contact admin to request elevated access')}
                    className="btn-secondary text-center"
                  >
                    Request Access
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}