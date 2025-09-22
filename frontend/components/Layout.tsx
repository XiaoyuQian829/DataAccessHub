'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { authService } from '../services/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Define navigation items with role-based access
  const allNavigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard',
      roles: ['Administrator', 'Data Manager', 'Data Analyst', 'Researcher', 'Guest']
    },
    { 
      name: 'My Requests', 
      href: '/approvals',
      roles: ['Administrator', 'Data Manager', 'Data Analyst', 'Researcher']
    },
    { 
      name: 'Approval Workflow', 
      href: '/workflow',
      roles: ['Administrator', 'Data Manager', 'Data Analyst', 'Researcher']
    },
    { 
      name: 'Datasets', 
      href: '/datasets',
      roles: ['Administrator', 'Data Manager', 'Data Analyst']
    },
    { 
      name: 'Permissions', 
      href: '/permissions',
      roles: ['Administrator', 'Data Manager']
    },
    { 
      name: 'Audit Logs', 
      href: '/audit',
      roles: ['Administrator']
    },
    { 
      name: 'Test Data', 
      href: '/test-data',
      roles: ['Administrator']
    },
  ];

  // Filter navigation based on user roles
  const navigation = user && !loading 
    ? allNavigationItems.filter(item => authService.hasAnyRole(user, item.roles))
    : allNavigationItems;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">DataAccessHub</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      {user?.username}
                    </p>
                    {user?.roles && user.roles.length > 0 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {user.roles[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full text-left text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">DataAccessHub</h1>
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}