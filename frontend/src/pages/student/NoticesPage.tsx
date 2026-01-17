import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { NoticesList } from '../../components/student/NoticesList';
import { NoticesFilters } from '../../components/student/NoticesFilters';
import { apiService } from '../../services/api';
import { Notice } from '../../../shared/types';

interface NoticesResponse {
  notices: Notice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    category: '',
    search: '',
  });

  const fetchNotices = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (newFilters.category) {
        params.append('category', newFilters.category);
      }

      if (newFilters.search) {
        params.append('search', newFilters.search);
      }

      const response = await apiService.get<NoticesResponse>(`/notices?${params}`);
      
      setNotices(response.notices);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      console.error('Failed to fetch notices:', err);
      setError(err.response?.data?.error || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    fetchNotices(1, newFilters);
  };

  const handlePageChange = (page: number) => {
    fetchNotices(page);
  };

  const handleRefresh = () => {
    fetchNotices(pagination.page);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Notices</h1>
            <p className="text-gray-600">
              Discover opportunities and stay updated with university announcements
            </p>
          </div>
          <button
            onClick={handleRefresh}
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
        <NoticesFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />

        {/* Notices List */}
        <NoticesList
          notices={notices}
          loading={loading}
          error={error}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
      </div>
    </StudentLayout>
  );
};