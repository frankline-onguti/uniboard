import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ApplyButtonProps {
  noticeId: string;
}

interface ApplicationStatus {
  hasApplied: boolean;
  applicationId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({ noticeId }) => {
  const { user } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    hasApplied: false,
  });
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user has already applied
  useEffect(() => {
    checkApplicationStatus();
  }, [noticeId]);

  const checkApplicationStatus = async () => {
    if (!user || user.role !== 'student') return;

    try {
      setLoading(true);
      const response = await apiService.get<{
        applications: Array<{
          id: string;
          noticeId: string;
          status: 'pending' | 'approved' | 'rejected';
        }>;
      }>('/applications/me?limit=100');

      const existingApplication = response.applications.find(
        app => app.noticeId === noticeId
      );

      if (existingApplication) {
        setApplicationStatus({
          hasApplied: true,
          applicationId: existingApplication.id,
          status: existingApplication.status,
        });
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || user.role !== 'student') return;

    try {
      setApplying(true);
      setError(null);
      setSuccess(null);

      await apiService.post('/applications', {
        noticeId,
        applicationData: {
          appliedAt: new Date().toISOString(),
          studentInfo: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            studentId: user.studentId,
          },
        },
      });

      setApplicationStatus({
        hasApplied: true,
        status: 'pending',
      });

      setSuccess('Application submitted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Application failed:', err);
      const errorMessage = err.response?.data?.error || 'Failed to submit application';
      setError(errorMessage);
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setApplying(false);
    }
  };

  const getStatusBadge = () => {
    if (!applicationStatus.status) return null;

    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Under Review',
      },
      approved: {
        color: 'bg-green-100 text-green-800',
        text: 'Approved',
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        text: 'Not Selected',
      },
    };

    const config = statusConfig[applicationStatus.status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Don't show button for non-students
  if (!user || user.role !== 'student') {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        <span className="text-sm text-gray-500">Checking status...</span>
      </div>
    );
  }

  // Already applied
  if (applicationStatus.hasApplied) {
    return (
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-gray-700">Applied</span>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={applying}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {applying ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Applying...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Apply Now
          </>
        )}
      </button>

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};