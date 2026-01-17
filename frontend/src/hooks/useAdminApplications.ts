import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Application, ApplicationStatus } from '../../../shared/types';

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseAdminApplicationsOptions {
  status?: ApplicationStatus;
  noticeId?: string;
  autoFetch?: boolean;
}

export const useAdminApplications = (options: UseAdminApplicationsOptions = {}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchApplications = async (page = 1, filters: UseAdminApplicationsOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.status) {
        params.append('status', filters.status);
      }

      if (filters.noticeId) {
        params.append('noticeId', filters.noticeId);
      }

      const response = await apiService.get<ApplicationsResponse>(`/applications?${params}`);
      
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

  const approveApplication = async (id: string, adminNotes?: string): Promise<Application> => {
    try {
      setError(null);
      const application = await apiService.post<Application>(`/applications/${id}/approve`, {
        adminNotes: adminNotes || undefined,
      });
      
      // Update application in local state
      setApplications(prev => prev.map(app => app.id === id ? application : app));
      
      return application;
    } catch (err: any) {
      console.error('Failed to approve application:', err);
      const errorMessage = err.response?.data?.error || 'Failed to approve application';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const rejectApplication = async (id: string, adminNotes: string): Promise<Application> => {
    try {
      setError(null);
      
      if (!adminNotes || adminNotes.trim().length === 0) {
        throw new Error('Admin notes are required when rejecting an application');
      }

      const application = await apiService.post<Application>(`/applications/${id}/reject`, {
        adminNotes: adminNotes.trim(),
      });
      
      // Update application in local state
      setApplications(prev => prev.map(app => app.id === id ? application : app));
      
      return application;
    } catch (err: any) {
      console.error('Failed to reject application:', err);
      const errorMessage = err.response?.data?.error || 'Failed to reject application';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshApplications = () => {
    fetchApplications(pagination.page, options);
  };

  const changePage = (page: number) => {
    fetchApplications(page, options);
  };

  const applyFilters = (filters: UseAdminApplicationsOptions) => {
    fetchApplications(1, filters);
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchApplications(1, options);
    }
  }, [options.status, options.noticeId]);

  return {
    applications,
    loading,
    error,
    pagination,
    fetchApplications,
    approveApplication,
    rejectApplication,
    refreshApplications,
    changePage,
    applyFilters,
  };
};