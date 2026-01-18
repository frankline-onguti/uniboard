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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-indigo-100 text-lg">
            Stay updated with the latest opportunities and manage your applications.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12h6m-6-4h6m2 5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Notices</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.activeNotices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">My Applications</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalApplications}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Approved</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.approvedApplications}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = '/student/notices'}
              className="group flex items-center p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12h6m-6-4h6m2 5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 text-left">
                <p className="text-base font-semibold text-gray-900 group-hover:text-indigo-700">Browse Notices</p>
                <p className="text-sm text-gray-500">Find new opportunities</p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/student/applications'}
              className="group flex items-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4 text-left">
                <p className="text-base font-semibold text-gray-900 group-hover:text-green-700">My Applications</p>
                <p className="text-sm text-gray-500">Track your submissions</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};