import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Notice } from '@shared/types';

interface NoticesResponse {
  notices: Notice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseNoticesOptions {
  category?: string;
  search?: string;
  autoFetch?: boolean;
}

export const useNotices = (options: UseNoticesOptions = {}) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchNotices = async (page = 1, filters: { category?: string; search?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.category) {
        params.append('category', filters.category);
      }

      if (filters.search) {
        params.append('search', filters.search);
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

  const refreshNotices = () => {
    fetchNotices(pagination.page, {
      category: options.category,
      search: options.search,
    });
  };

  const changePage = (page: number) => {
    fetchNotices(page, {
      category: options.category,
      search: options.search,
    });
  };

  const applyFilters = (filters: { category?: string; search?: string }) => {
    fetchNotices(1, filters);
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchNotices(1, {
        category: options.category,
        search: options.search,
      });
    }
  }, [options.category, options.search]);

  return {
    notices,
    loading,
    error,
    pagination,
    fetchNotices,
    refreshNotices,
    changePage,
    applyFilters,
  };
};