import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">UniBoard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {user.role.replace('_', ' ').toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {user.role === 'student' && 'Student Dashboard'}
                {user.role === 'admin' && 'Admin Dashboard'}
                {user.role === 'super_admin' && 'Super Admin Dashboard'}
              </h2>
              
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">{user.firstName} {user.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="text-sm text-gray-900">{user.role}</dd>
                    </div>
                    {user.studentId && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                        <dd className="text-sm text-gray-900">{user.studentId}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Role Permissions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${hasRole('student') ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                      <span className="text-sm text-gray-700">Student Access</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${hasRole('admin') ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                      <span className="text-sm text-gray-700">Admin Access</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${hasRole('super_admin') ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                      <span className="text-sm text-gray-700">Super Admin Access</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    🔐 <strong>Phase 2 Complete:</strong> Authentication & Authorization working correctly.
                    Role-based access control is enforced. No dashboard features implemented yet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};