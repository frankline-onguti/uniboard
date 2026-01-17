import React from 'react';
import { Application } from '../../../shared/types';
import { ApplicationCard } from './ApplicationCard';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { Pagination } from '../shared/Pagination';

interface ApplicationsListProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  applications,
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
}) => {
  // Loading state
  if (loading && applications.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && applications.length === 0) {
    return (
      <ErrorState
        title="Failed to load applications"
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  // Empty state
  if (!loading && applications.length === 0) {
    return (
      <EmptyState
        title="No applications found"
        message="You haven't submitted any applications yet. Browse available notices to find opportunities to apply for."
        icon="clipboard"
        action={{
          label: 'Browse Notices',
          onClick: () => window.location.href = '/student/notices',
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Results summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} applications
        </p>
        {loading && applications.length > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Updating...
          </div>
        )}
      </div>

      {/* Applications grid */}
      <div className="grid gap-6">
        {applications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};