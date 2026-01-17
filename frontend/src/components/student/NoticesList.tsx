import React from 'react';
import { Notice } from '../../../shared/types';
import { NoticeCard } from './NoticeCard';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { Pagination } from '../shared/Pagination';

interface NoticesListProps {
  notices: Notice[];
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

export const NoticesList: React.FC<NoticesListProps> = ({
  notices,
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
}) => {
  // Loading state
  if (loading && notices.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && notices.length === 0) {
    return (
      <ErrorState
        title="Failed to load notices"
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  // Empty state
  if (!loading && notices.length === 0) {
    return (
      <EmptyState
        title="No notices found"
        message="There are currently no active notices available. Check back later for new opportunities."
        icon="document"
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
          {pagination.total} notices
        </p>
        {loading && notices.length > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Updating...
          </div>
        )}
      </div>

      {/* Notices grid */}
      <div className="grid gap-6">
        {notices.map((notice) => (
          <NoticeCard key={notice.id} notice={notice} />
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