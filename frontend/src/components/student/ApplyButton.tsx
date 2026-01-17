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
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user has already applied
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user || user.role !== 'student') return;

      try {
        setCheckingStatus(true);
        const response = await apiService.get<{
          applications: Array<{
            id: string;
            noticeId: string;
            status: 'pending' | 'approved' | 'rejected';
          }>;
        }>('/applications/me');

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
      } catch (err) {
        console.error('Failed to check application status:', err);
        // Don't show error for status check, just assume not applied
      } finally {
        setCheckingStatus(false);
      }
    };

    checkApplicationStatus();
  }, [noticeId, user]);

  const handleApply = async () => {
    if (!user || user.role !== 'student') return;

    try {
      setLoading(true);
      setError(null);

      await apiService.post('/applications', {
        noticeId,
        applicationData: {
          submittedAt: new Date().toISOString(),
          studentInfo: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            studentId: user.studentId,
          },
        },
      });

      // Update status
      setApplicationStatus({
        hasApplied: true,
        status: 'pending',
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err: any) {
      console.error('Application failed:', err);
      const errorMessage = err.response?.data?.error || 'Failed to submit application';
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for non-students
  if (!user || user.role !== 'student') {
    return null;
  }

  // Loading state while checking status
  if (checkingStatus) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
      </div>
    );
  }

  // Success message
  if (showSuccess) {
    return (
      <div className="flex items-center text-green-600">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Application submitted!</span>
      </div>
    );
  }

  // Error message
  if (error) {
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={handleApply}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Applying...
            </>
          ) : (
            'Apply Now'
          )}
        </button>
        <div className="mt-1 text-xs text-red-600 max-w-xs text-right">
          {error}
        </div>
      </div>
    );
  }

  // Already applied - show status
  if (applicationStatus.hasApplied) {
    const getStatusDisplay = () => {
      switch (applicationStatus.status) {
        case 'pending':
          return {
            text: 'Application Pending',
            className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: (
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            ),
          };
        case 'approved':
          return {
            text: 'Application Approved',
            className: 'bg-green-100 text-green-800 border-green-200',
            icon: (
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ),
          };
        case 'rejected':
          return {
            text: 'Application Not Selected',
            className: 'bg-red-100 text-red-800 border-red-200',
            icon: (
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ),
          };
        default:
          return {
            text: 'Applied',
            className: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: null,
          };
      }
    };

    const statusDisplay = getStatusDisplay();

    return (
      <div className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${statusDisplay.className}`}>
        {statusDisplay.icon}
        {statusDisplay.text}
      </div>
    );
  }

  // Apply button
  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
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
  );
};