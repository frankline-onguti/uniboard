import React, { useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { ApplicationsList } from '../../components/student/ApplicationsList';
import { ApplicationsFilters } from '../../components/student/ApplicationsFilters';
import { useApplications } from '../../hooks/useApplications';

export const ApplicationsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const {
    applications,
    loading,
    error,
    pagination,
    fetchApplications,
    refreshApplications,
  } = useApplications({ status: statusFilter });

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchApplications(1, { status });
  };

  const handlePageChange = (page: number) => {
    fetchApplications(page, { status: statusFilter });
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600">
              Track the status of your submitted applications
            </p>
          </div>
          <button
            onClick={refreshApplications}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <ApplicationsFilters
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          loading={loading}
        />

        {/* Applications List */}
        <ApplicationsList
          applications={applications}
          loading={loading}
          error={error}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={refreshApplications}
        />
      </div>
    </StudentLayout>
  );
};