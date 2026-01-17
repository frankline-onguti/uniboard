import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Application } from '../../shared/types';

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseApplicationsOptions {
  status?: 'pending' | 'approved' | 'rejected';
  autoFetch?: boolean;
}

export const useApplications = (options: UseApplicationsOptions = {}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchApplications = async (page = 1, status?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await apiService.get<ApplicationsResponse>(`/applications/me?${params}`);
      
      setApplications(response.applications);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      setError(err.response?.data?.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const refreshApplications = () => {
    fetchApplications(pagination.page, options.status);
  };

  const changePage = (page: number) => {
    fetchApplications(page, options.status);
  };

  const filterByStatus = (status?: string) => {
    fetchApplications(1, status);
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchApplications(1, options.status);
    }
  }, [options.status]);

  return {
    applications,
    loading,
    error,
    pagination,
    fetchApplications,
    refreshApplications,
    changePage,
    filterByStatus,
  };
};