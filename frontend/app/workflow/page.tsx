'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import Layout from '../../components/Layout';
import { approvalService, ApprovalRequest } from '../../services/approvals';

export default function WorkflowPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchRequests();
  }, [activeTab, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let data: ApprovalRequest[] = [];
      
      if (activeTab === 'pending') {
        // Get requests pending for this user's role
        const userRole = getUserRole();
        data = approvalService.getRequestsForReview(userRole);
      } else if (activeTab === 'all') {
        data = await approvalService.getMyRequests();
      } else {
        data = approvalService.getRequestsByStatus(activeTab as ApprovalRequest['status']);
      }
      
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (): string => {
    if (!user?.roles?.length) return '';
    const role = user.roles[0];
    
    // Map user roles to workflow roles
    switch (role) {
      case 'Administrator':
        return 'Administrator';
      case 'Data Manager':
        return 'Ethics'; // Data Managers handle ethics review
      default:
        return 'PI'; // Others can act as PI
    }
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    try {
      const userRole = getUserRole();
      const approved = reviewAction === 'approve';
      const reviewer = user?.username || 'Unknown';

      let updatedRequest: ApprovalRequest;

      switch (userRole) {
        case 'PI':
          updatedRequest = await approvalService.piReview(
            selectedRequest.id, 
            approved, 
            reviewComment, 
            reviewer
          );
          break;
        case 'Ethics':
          updatedRequest = await approvalService.ethicsReview(
            selectedRequest.id, 
            approved, 
            reviewComment, 
            reviewer
          );
          break;
        case 'Administrator':
          if (selectedRequest.status === 'PENDING_ADMIN') {
            updatedRequest = await approvalService.adminReview(
              selectedRequest.id, 
              approved, 
              reviewComment, 
              reviewer
            );
          } else {
            // Manual override for AI review
            updatedRequest = await approvalService.manualOverride(
              selectedRequest.id, 
              approved, 
              reviewComment, 
              reviewer
            );
          }
          break;
        default:
          throw new Error('Unauthorized to perform this action');
      }

      // Update the request in the list
      setRequests(prev => 
        prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
      );

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewComment('');
    } catch (error) {
      console.error('Review failed:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const openReviewModal = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const getStatusColor = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_PI':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_ETHICS':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING_ADMIN':
        return 'bg-orange-100 text-orange-800';
      case 'AI_REVIEW':
        return 'bg-indigo-100 text-indigo-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      case 'LOCKED':
        return 'bg-red-200 text-red-900';
      case 'APPEALED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSensitivityColor = (sensitivity: 'normal' | 'high' | 'critical') => {
    switch (sensitivity) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
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

  const canReview = (request: ApprovalRequest): boolean => {
    const userRole = getUserRole();
    return approvalService.canPerformAction(request, `${userRole.toLowerCase()}_review`, userRole) ||
           approvalService.canPerformAction(request, 'manual_override', userRole);
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
                  Approval Workflow
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Review and manage data access requests through the approval pipeline
                </p>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Role:</span> {getUserRole()}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Review ({approvalService.getRequestsForReview(getUserRole()).length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Requests
              </button>
              <button
                onClick={() => setActiveTab('APPROVED')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'APPROVED'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveTab('REJECTED')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'REJECTED'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rejected
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No requests found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No requests match the current filter.
                    </p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {request.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSensitivityColor(request.sensitivity)}`}>
                              {request.sensitivity.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">
                            {request.description}
                          </p>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Applicant:</span> {request.applicant}
                            </div>
                            <div>
                              <span className="font-medium">Dataset:</span> {request.dataset}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {formatDate(request.created_at)}
                            </div>
                            <div>
                              <span className="font-medium">Current Step:</span> {approvalService.getWorkflowStatus(request)}
                            </div>
                          </div>

                          {/* AI Review Information */}
                          {request.ai_recommendation && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">AI Analysis</h4>
                              <div className="text-sm text-gray-600">
                                <p><span className="font-medium">Recommendation:</span> {request.ai_recommendation}</p>
                                <p><span className="font-medium">Confidence:</span> {((request.ai_confidence || 0) * 100).toFixed(1)}%</p>
                                <p><span className="font-medium">Analysis:</span> {request.ai_analysis}</p>
                              </div>
                            </div>
                          )}

                          {/* Review History */}
                          {request.audit_trail && request.audit_trail.length > 1 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Review History</h4>
                              <div className="space-y-2">
                                {request.audit_trail.slice(-3).map((entry, index) => (
                                  <div key={index} className="text-xs text-gray-500">
                                    <span className="font-medium">{formatDate(entry.timestamp)}</span> - 
                                    <span className="ml-1">{entry.actor}</span> - 
                                    <span className="ml-1">{entry.details}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {canReview(request) && (
                          <div className="ml-6 flex space-x-3">
                            <button
                              onClick={() => openReviewModal(request, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openReviewModal(request, 'reject')}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Request
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Request:</span> {selectedRequest.title}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Applicant:</span> {selectedRequest.applicant}
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comment *
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Provide your review comments..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedRequest(null);
                    setReviewComment('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={!reviewComment.trim()}
                  className={`font-medium py-2 px-4 rounded-md transition-colors ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}