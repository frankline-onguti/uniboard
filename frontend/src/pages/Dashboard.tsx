import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Redirect users to their role-specific dashboards
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'student':
      return <Navigate to="/student" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};