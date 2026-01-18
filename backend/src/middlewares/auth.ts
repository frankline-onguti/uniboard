import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { DatabaseService } from '../services/databaseService';
import { UserRole } from '../../../shared/types';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { hasPermission } from '../models/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
        studentId?: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    // Verify token
    const payload = JWTService.verifyAccessToken(token);

    // Get user from database to ensure they still exist
    const user = await DatabaseService.findUserById(payload.userId);
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      ...(user.studentId && { studentId: user.studentId }),
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that requires specific role or higher
 */
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!hasPermission(req.user.role, requiredRole)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      });
      return;
    }

    next();
  };
};

/**
 * Multiple role authorization middleware
 * Allows access if user has any of the specified roles
 */
export const requireAnyRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const hasAllowedRole = allowedRoles.some(role => 
      hasPermission(req.user!.role, role) || req.user!.role === role
    );

    if (!hasAllowedRole) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      });
      return;
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources (unless admin/super_admin)
 */
export const requireOwnership = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Super admin and admin can access any resource
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
    if (resourceUserId !== req.user.id) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied: insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Student-only middleware
 * Restricts access to students only
 */
export const requireStudent = requireRole('student');

/**
 * Admin-only middleware  
 * Restricts access to admin and super_admin only
 */
export const requireAdmin = requireRole('admin');

/**
 * Super admin-only middleware
 * Restricts access to super_admin only
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Admin or Super Admin middleware
 * Allows access for admin and super_admin roles
 */
export const requireAdminOrSuperAdmin = requireAnyRole(['admin', 'super_admin']);

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = JWTService.verifyAccessToken(token);
      const user = await DatabaseService.findUserById(payload.userId);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          ...(user.studentId && { studentId: user.studentId }),
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};