import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Notice, CreateNoticeRequest } from '@shared/types';

interface NoticesResponse {
  notices: Notice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseAdminNoticesOptions {
  category?: string;
  search?: string;
  active?: boolean;
  includeExpired?: boolean;
  autoFetch?: boolean;
}

export const useAdminNotices = (options: UseAdminNoticesOptions = {}) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchNotices = async (page = 1, filters: UseAdminNoticesOptions = {}) => {
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

      if (filters.active !== undefined) {
        params.append('active', filters.active.toString());
      }

      if (filters.includeExpired !== undefined) {
        params.append('includeExpired', filters.includeExpired.toString());
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

  const createNotice = async (data: CreateNoticeRequest): Promise<Notice> => {
    try {
      setError(null);
      const notice = await apiService.post<Notice>('/notices', data);
      
      // Refresh notices list
      await fetchNotices(pagination.page, options);
      
      return notice;
    } catch (err: any) {
      console.error('Failed to create notice:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create notice';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateNotice = async (id: string, data: Partial<CreateNoticeRequest>): Promise<Notice> => {
    try {
      setError(null);
      const notice = await apiService.put<Notice>(`/notices/${id}`, data);
      
      // Update notice in local state
      setNotices(prev => prev.map(n => n.id === id ? notice : n));
      
      return notice;
    } catch (err: any) {
      console.error('Failed to update notice:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update notice';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteNotice = async (id: string): Promise<void> => {
    try {
      setError(null);
      await apiService.delete(`/notices/${id}`);
      
      // Remove notice from local state
      setNotices(prev => prev.filter(n => n.id !== id));
      
      // If this was the last notice on the page, go to previous page
      if (notices.length === 1 && pagination.page > 1) {
        await fetchNotices(pagination.page - 1, options);
      }
    } catch (err: any) {
      console.error('Failed to delete notice:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete notice';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshNotices = () => {
    fetchNotices(pagination.page, options);
  };

  const changePage = (page: number) => {
    fetchNotices(page, options);
  };

  const applyFilters = (filters: UseAdminNoticesOptions) => {
    fetchNotices(1, filters);
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchNotices(1, options);
    }
  }, [options.category, options.search, options.active, options.includeExpired]);

  return {
    notices,
    loading,
    error,
    pagination,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    refreshNotices,
    changePage,
    applyFilters,
  };
};