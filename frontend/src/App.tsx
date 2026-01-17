import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { NoticesPage } from './pages/student/NoticesPage';
import { ApplicationsPage } from './pages/student/ApplicationsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminNoticesPage } from './pages/admin/AdminNoticesPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { SuperAdminDashboard } from './pages/superAdmin/SuperAdminDashboard';
import { UserManagementPage } from './pages/superAdmin/UserManagementPage';
import { Unauthorized } from './pages/Unauthorized';

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes - redirect if authenticated */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterForm />
                </PublicRoute>
              }
            />

            {/* Protected routes - require authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notices"
              element={
                <ProtectedRoute requiredRole="student">
                  <NoticesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute requiredRole="student">
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminNoticesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminApplicationsPage />
                </ProtectedRoute>
              }
            />

            {/* Super Admin routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/users"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Unauthorized page */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Default redirect based on role */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } 
            />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;