'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { approvalService, ApprovalRequest } from '../../services/approvals';

// ApprovalRequest interface is now imported from services

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-requests');

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let data: ApprovalRequest[] = [];
      
      if (activeTab === 'my-requests') {
        data = await approvalService.getMyRequests();
      } else if (activeTab === 'pending-approvals') {
        data = await approvalService.getPendingApprovals();
      }
      
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Approval Requests
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Manage your data access requests and approvals
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchRequests}
                  disabled={loading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <Link
                  href="/approvals/new"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Submit New Request
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('my-requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Requests
              </button>
              <button
                onClick={() => setActiveTab('pending-approvals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending-approvals'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Approvals
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading requests...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.length === 0 ? (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No requests found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by submitting a new approval request.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/approvals/new"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Submit New Request
                      </Link>
                    </div>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {request.title}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {request.description}
                          </p>
                          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                            <span>
                              <strong>Applicant:</strong> {request.applicant}
                            </span>
                            <span>
                              <strong>Submitted:</strong> {formatDate(request.created_at)}
                            </span>
                            <span>
                              <strong>Current Step:</strong> {request.current_step}
                            </span>
                          </div>
                        </div>
                        <div className="ml-6 flex space-x-3">
                          <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                            View Details
                          </button>
                          {request.status === 'PENDING' && (
                            <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}