import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Mock API service
vi.mock('../services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

const { apiService } = await import('../services/api');

// Test component to access auth context
const TestComponent = () => {
  const { isAuthenticated, user, hasRole } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      {user && (
        <div data-testid="user-info">
          {user.firstName} {user.lastName} - {user.role}
        </div>
      )}
      <div data-testid="student-access">
        {hasRole('student') ? 'has-student-access' : 'no-student-access'}
      </div>
      <div data-testid="admin-access">
        {hasRole('admin') ? 'has-admin-access' : 'no-admin-access'}
      </div>
    </div>
  );
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with unauthenticated state', async () => {
    apiService.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('student-access')).toHaveTextContent('no-student-access');
      expect(screen.getByTestId('admin-access')).toHaveTextContent('no-admin-access');
    });
  });

  it('should authenticate user on successful login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@university.edu',
      role: 'student' as const,
      firstName: 'John',
      lastName: 'Doe',
      studentId: 'STU123456',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    apiService.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    apiService.login.mockResolvedValue({
      user: mockUser,
      accessToken: 'mock-token',
    });

    const LoginTestComponent = () => {
      const { login } = useAuth();
      return (
        <div>
          <TestComponent />
          <button
            onClick={() => login('test@university.edu', 'password')}
            data-testid="login-button"
          >
            Login
          </button>
        </div>
      );
    };

    renderWithAuth(<LoginTestComponent />);

    // Wait for initial state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    // Trigger login
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe - student');
      expect(screen.getByTestId('student-access')).toHaveTextContent('has-student-access');
      expect(screen.getByTestId('admin-access')).toHaveTextContent('no-admin-access');
    });
  });

  it('should handle role hierarchy correctly', async () => {
    const mockAdminUser = {
      id: '456',
      email: 'admin@university.edu',
      role: 'admin' as const,
      firstName: 'Admin',
      lastName: 'User',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    apiService.getCurrentUser.mockResolvedValue(mockAdminUser);

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('Admin User - admin');
      expect(screen.getByTestId('student-access')).toHaveTextContent('has-student-access');
      expect(screen.getByTestId('admin-access')).toHaveTextContent('has-admin-access');
    });
  });
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form correctly', () => {
    renderWithAuth(<LoginForm />);

    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithAuth(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    renderWithAuth(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', async () => {
    const mockUser = {
      id: '123',
      email: 'test@university.edu',
      role: 'student' as const,
      firstName: 'John',
      lastName: 'Doe',
      studentId: 'STU123456',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    apiService.getCurrentUser.mockResolvedValue(mockUser);

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should redirect when user is not authenticated', async () => {
    apiService.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should enforce role requirements', async () => {
    const mockStudentUser = {
      id: '123',
      email: 'student@university.edu',
      role: 'student' as const,
      firstName: 'Student',
      lastName: 'User',
      studentId: 'STU123456',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    apiService.getCurrentUser.mockResolvedValue(mockStudentUser);

    renderWithAuth(
      <ProtectedRoute requiredRole="admin">
        <div data-testid="admin-content">Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });
});