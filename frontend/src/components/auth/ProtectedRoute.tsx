import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../../shared/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, loading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Convenience components for specific roles
export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="student">{children}</ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="super_admin">{children}</ProtectedRoute>
);

export const AdminOrSuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>{children}</ProtectedRoute>
);

// Public route (redirects authenticated users)
export const PublicRoute: React.FC<{ 
  children: React.ReactNode; 
  redirectTo?: string;
}> = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};