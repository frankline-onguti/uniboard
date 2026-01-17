import { UserRole } from '../../../shared/types';

export interface UserModel {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  studentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  studentId?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  role?: UserRole;
}

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  studentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithStats extends UserPublic {
  stats?: {
    totalApplications?: number;
    pendingApplications?: number;
    approvedApplications?: number;
    rejectedApplications?: number;
    noticesCreated?: number; // For admins
    applicationsReviewed?: number; // For admins
  };
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 1,
  admin: 2,
  super_admin: 3,
} as const;

// Role validation
export const isValidRole = (role: string): role is UserRole => {
  return ['student', 'admin', 'super_admin'].includes(role);
};

// Permission checking utilities
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const canAccessResource = (userRole: UserRole, resourceOwnerRole: UserRole): boolean => {
  // Super admin can access everything
  if (userRole === 'super_admin') return true;
  
  // Admin can access student resources
  if (userRole === 'admin' && resourceOwnerRole === 'student') return true;
  
  // Users can access their own resources (handled at application level)
  return false;
};

export const canManageUser = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  // Super admin can manage everyone
  if (currentUserRole === 'super_admin') return true;
  
  // Admin can manage students
  if (currentUserRole === 'admin' && targetUserRole === 'student') return true;
  
  return false;
};

export const canCreateRole = (currentUserRole: UserRole, targetRole: UserRole): boolean => {
  // Only super admin can create admins and super admins
  if (targetRole === 'admin' || targetRole === 'super_admin') {
    return currentUserRole === 'super_admin';
  }
  
  // Admin and super admin can create students
  if (targetRole === 'student') {
    return currentUserRole === 'admin' || currentUserRole === 'super_admin';
  }
  
  return false;
};

// Query filters
export interface UserFilters {
  role?: UserRole;
  search?: string; // Search in name or email
  isActive?: boolean;
}

export interface UserPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface UserQueryResult {
  users: UserPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User statistics
export interface UserStats {
  totalUsers: number;
  students: number;
  admins: number;
  superAdmins: number;
  recentRegistrations: number; // Last 30 days
}