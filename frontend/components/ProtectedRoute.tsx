'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (requiredRoles.length > 0 && !authService.hasAnyRole(user, requiredRoles)) {
        // User doesn't have required roles, redirect to fallback
        router.push(fallbackPath);
        return;
      }
    }
  }, [user, loading, requiredRoles, router, fallbackPath]);

  // Show loading state
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

  // Show access denied if user doesn't have required roles
  if (user && requiredRoles.length > 0 && !authService.hasAnyRole(user, requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <div className="h-6 w-6 text-red-600 font-bold text-lg">!</div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to access this page.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required roles: {requiredRoles.join(', ')}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your role: {user?.roles?.join(', ') || 'None'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push(fallbackPath)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}