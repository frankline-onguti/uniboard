import React from 'react';
import { Application } from '@shared/types';

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ),
          text: 'Under Review',
          description: 'Your application is being reviewed by the admissions team.',
        };
      case 'approved':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          text: 'Approved',
          description: 'Congratulations! Your application has been approved.',
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ),
          text: 'Not Selected',
          description: 'Your application was not selected for this opportunity.',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: null,
          text: 'Unknown',
          description: 'Status unknown.',
        };
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      scholarship: 'bg-green-100 text-green-800',
      job: 'bg-blue-100 text-blue-800',
      internship: 'bg-purple-100 text-purple-800',
      event: 'bg-yellow-100 text-yellow-800',
      career: 'bg-indigo-100 text-indigo-800',
      announcement: 'bg-gray-100 text-gray-800',
      academic: 'bg-red-100 text-red-800',
      housing: 'bg-orange-100 text-orange-800',
      financial_aid: 'bg-emerald-100 text-emerald-800',
      research: 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const statusConfig = getStatusConfig(application.status);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {application.notice?.category && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(application.notice.category)}`}>
                  {application.notice.category.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {application.notice?.title || 'Notice Title'}
            </h3>
            <p className="text-sm text-gray-500">
              Applied on {formatDate(application.createdAt)}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={`border rounded-lg p-4 mb-4 ${statusConfig.color}`}>
          <div className="flex items-center">
            {statusConfig.icon && (
              <div className="flex-shrink-0 mr-3">
                {statusConfig.icon}
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium">{statusConfig.text}</h4>
              <p className="text-sm opacity-90">{statusConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        {application.adminNotes && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h5>
            <p className="text-sm text-gray-700">{application.adminNotes}</p>
          </div>
        )}

        {/* Review Information */}
        {application.reviewedAt && application.reviewer && (
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>
              Reviewed on {formatDate(application.reviewedAt)} by{' '}
              {application.reviewer.firstName} {application.reviewer.lastName}
            </p>
          </div>
        )}

        {/* Application Data Preview */}
        {application.applicationData && Object.keys(application.applicationData).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Application Details</h5>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(application.applicationData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};