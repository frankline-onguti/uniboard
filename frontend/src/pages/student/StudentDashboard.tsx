import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { apiService } from '../../services/api';

interface DashboardStats {
  activeNotices: number;
  totalApplications: number;
  approvedApplications: number;
}

export const StudentDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeNotices: 0,
    totalApplications: 0,
    approvedApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirect non-students
  if (!hasRole('student')) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('=== DASHBOARD FETCH START ===');
        setLoading(true);
        
        // Fetch dashboard summary from dedicated endpoint
        const response = await apiService.get<DashboardStats>('/dashboard/student');
        console.log('=== RAW API RESPONSE ===', response);
        console.log('Response type:', typeof response);
        
        if (response && typeof response === 'object') {
          console.log('=== UPDATING STATE ===');
          console.log('New stats:', response);
          setStats(response);
          console.log('State should now be:', response);
        } else {
          console.error('=== API RESPONSE INVALID ===', response);
        }
      } catch (error) {
        console.error('=== API ERROR ===', error);
        // Keep default values on error
      } finally {
        console.log('=== SETTING LOADING FALSE ===');
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty dependency array to run only once

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">
            Stay updated with the latest opportunities and manage your applications.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Notices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats.activeNotices}
                </p>
                <p className="text-xs text-gray-400">
                  Debug: loading={loading.toString()}, stats={JSON.stringify(stats)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">My Applications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats.totalApplications}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats.approvedApplications}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = '/student/notices'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12h6m-6-4h6m2 5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h6" />
                </svg>
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm font-medium text-gray-900">Browse Notices</p>
                <p className="text-sm text-gray-500">Find new opportunities</p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/student/applications'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm font-medium text-gray-900">My Applications</p>
                <p className="text-sm text-gray-500">Track your submissions</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};