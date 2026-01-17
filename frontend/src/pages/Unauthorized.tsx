import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            
            <p className="mt-2 text-center text-sm text-gray-600">
              You don't have permission to access this resource.
            </p>

            {user && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  Current role: <span className="font-medium">{user.role}</span>
                </p>
                <p className="text-sm text-gray-700">
                  User: {user.firstName} {user.lastName}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <Link
                to="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>
                🔐 Role-based access control is working correctly.
                This page appears when users try to access resources
                above their permission level.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};