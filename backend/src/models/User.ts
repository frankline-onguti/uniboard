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