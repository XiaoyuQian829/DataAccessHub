'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import Link from 'next/link';

interface Dataset {
  id: number;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  fields_count: number;
}

export default function DatasetsPage() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockData: Dataset[] = [
        {
          id: 1,
          name: 'Customer Data',
          description: 'Customer information including demographics and purchase history',
          created_by: user?.username || 'admin',
          created_at: '2024-01-15T10:30:00Z',
          is_active: true,
          fields_count: 25
        },
        {
          id: 2,
          name: 'Financial Reports',
          description: 'Monthly and quarterly financial reports and analytics',
          created_by: user?.username || 'admin',
          created_at: '2024-01-10T14:20:00Z',
          is_active: true,
          fields_count: 15
        },
        {
          id: 3,
          name: 'User Analytics',
          description: 'Website and application usage analytics data',
          created_by: 'analytics_team',
          created_at: '2024-01-05T09:15:00Z',
          is_active: false,
          fields_count: 32
        }
      ];
      
      setDatasets(mockData);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Datasets
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Manage and configure your data sources and access permissions
                </p>
              </div>
              <div>
                <button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  Add New Dataset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {datasets.filter(d => d.is_active).length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Datasets
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
                    {datasets.reduce((total, d) => total + d.fields_count, 0)}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Fields
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
                    {datasets.length}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Datasets
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets List */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              All Datasets
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading datasets...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {datasets.length === 0 ? (
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No datasets found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new dataset.
                    </p>
                  </div>
                ) : (
                  datasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              {dataset.name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dataset.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {dataset.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {dataset.description}
                          </p>
                          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                            <span>
                              <strong>Created by:</strong> {dataset.created_by}
                            </span>
                            <span>
                              <strong>Created:</strong> {formatDate(dataset.created_at)}
                            </span>
                            <span>
                              <strong>Fields:</strong> {dataset.fields_count}
                            </span>
                          </div>
                        </div>
                        <div className="ml-6 flex space-x-3">
                          <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                            View Fields
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                            Configure
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                            Permissions
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button className="btn-primary text-center">
                Add New Dataset
              </button>
              <button className="btn-secondary text-center">
                Import Schema
              </button>
              <button className="btn-secondary text-center">
                Export Configuration
              </button>
              <Link
                href="/approvals/new"
                className="btn-secondary text-center inline-block"
              >
                Request Dataset Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}