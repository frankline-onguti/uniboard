import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';

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

            {/* Unauthorized page */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;