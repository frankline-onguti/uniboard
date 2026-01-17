import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminApplications } from '../../hooks/useAdminApplications';
import { Application, ApplicationStatus } from '@shared/types';

interface ReviewModalData {
  application: Application;
  action: 'approve' | 'reject';
}

export const AdminApplicationsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { applications, loading, error, pagination, approveApplication, rejectApplication, changePage, applyFilters } = useAdminApplications();
  
  const [reviewModal, setReviewModal] = useState<ReviewModalData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openReviewModal = (application: Application, action: 'approve' | 'reject') => {
    setReviewModal({ application, action });
    setAdminNotes('');
    setReviewError(null);
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setAdminNotes('');
    setReviewError(null);
  };

  const handleReview = async () => {
    if (!reviewModal) return;

    setReviewLoading(true);
    setReviewError(null);

    try {
      if (reviewModal.action === 'approve') {
        await approveApplication(reviewModal.application.id, adminNotes);
      } else {
        if (!adminNotes.trim()) {
          setReviewError('Admin notes are required when rejecting an application');
          return;
        }
        await rejectApplication(reviewModal.application.id, adminNotes);
      }
      
      closeReviewModal();
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleFilterChange = (status: ApplicationStatus | '') => {
    setStatusFilter(status);
    applyFilters({ status: status || undefined });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const styles: Record<ApplicationStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', current: false },
    { name: 'Notices', href: '/admin/notices', current: false },
    { name: 'Applications', href: '/admin/applications', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">UniBoard Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {user.role.replace('_', ' ').toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Application Review</h2>
              <p className="mt-1 text-sm text-gray-600">
                Review and moderate student applications
              </p>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by status:</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value as ApplicationStatus | '')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Applications</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {reviewModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {reviewModal.action === 'approve' ? 'Approve Application' : 'Reject Application'}
                  </h3>
                  
                  {/* Application Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Student:</strong> {reviewModal.application.student?.firstName} {reviewModal.application.student?.lastName}</div>
                      <div><strong>Email:</strong> {reviewModal.application.student?.email}</div>
                      <div><strong>Student ID:</strong> {reviewModal.application.student?.studentId}</div>
                      <div><strong>Notice:</strong> {reviewModal.application.notice?.title}</div>
                      <div><strong>Category:</strong> {reviewModal.application.notice?.category}</div>
                      <div><strong>Applied:</strong> {new Date(reviewModal.application.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {reviewError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-700">{reviewError}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes {reviewModal.action === 'reject' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={
                        reviewModal.action === 'approve' 
                          ? 'Optional notes about the approval...' 
                          : 'Required: Explain why this application is being rejected...'
                      }
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={closeReviewModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReview}
                      disabled={reviewLoading}
                      className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${
                        reviewModal.action === 'approve' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {reviewLoading ? 'Processing...' : (reviewModal.action === 'approve' ? 'Approve' : 'Reject')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Applications List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications found</p>
                  {statusFilter && (
                    <button
                      onClick={() => handleFilterChange('')}
                      className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm"
                    >
                      Clear filter to see all applications
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {application.notice?.title}
                            </h3>
                            {getStatusBadge(application.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Student:</strong> {application.student?.firstName} {application.student?.lastName}</p>
                              <p><strong>Email:</strong> {application.student?.email}</p>
                              <p><strong>Student ID:</strong> {application.student?.studentId}</p>
                            </div>
                            <div>
                              <p><strong>Category:</strong> {application.notice?.category}</p>
                              <p><strong>Applied:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
                              {application.reviewedAt && (
                                <p><strong>Reviewed:</strong> {new Date(application.reviewedAt).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>

                          {application.adminNotes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm"><strong>Admin Notes:</strong> {application.adminNotes}</p>
                            </div>
                          )}
                        </div>

                        {application.status === 'pending' && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => openReviewModal(application, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openReviewModal(application, 'reject')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applications
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => changePage(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => changePage(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};