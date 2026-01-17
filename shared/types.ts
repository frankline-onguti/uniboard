// Shared TypeScript types between frontend and backend

export type UserRole = 'student' | 'admin' | 'super_admin';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  studentId?: string; // Only for students
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  createdBy: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  author?: Pick<User, 'firstName' | 'lastName' | 'email'>;
}

export interface Application {
  id: string;
  noticeId: string;
  studentId: string;
  status: ApplicationStatus;
  applicationData?: Record<string, any>;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  notice?: Pick<Notice, 'title' | 'category'>;
  student?: Pick<User, 'firstName' | 'lastName' | 'email' | 'studentId'>;
  reviewer?: Pick<User, 'firstName' | 'lastName' | 'email'>;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// API Request/Response types
export interface CreateNoticeRequest {
  title: string;
  content: string;
  category: string;
  expiresAt?: string;
}

export interface UpdateNoticeRequest extends Partial<CreateNoticeRequest> {
  isActive?: boolean;
}

export interface CreateApplicationRequest {
  noticeId: string;
  applicationData?: Record<string, any>;
}

export interface UpdateApplicationRequest {
  status: ApplicationStatus;
  adminNotes?: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

// API Response wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameters
export interface NoticeQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  active?: boolean;
  search?: string;
}

export interface ApplicationQueryParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  noticeId?: string;
  studentId?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

// Permission utilities
export const PERMISSIONS = {
  CREATE_NOTICE: ['admin', 'super_admin'],
  MANAGE_APPLICATIONS: ['admin', 'super_admin'],
  MANAGE_USERS: ['super_admin'],
  CREATE_ADMIN: ['super_admin'],
  VIEW_ALL_APPLICATIONS: ['admin', 'super_admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Utility type for role checking
export type RolePermissions = {
  [K in Permission]: UserRole[];
};

// Constants
export const USER_ROLES: UserRole[] = ['student', 'admin', 'super_admin'];
export const APPLICATION_STATUSES: ApplicationStatus[] = ['pending', 'approved', 'rejected'];

// Validation schemas (for runtime validation)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const STUDENT_ID_REGEX = /^[A-Z0-9]{6,12}$/;