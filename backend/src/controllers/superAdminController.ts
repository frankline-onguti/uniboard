import { Request, Response } from 'express';
import { PasswordService, SecurityService } from '../services/authService';
import { DatabaseService } from '../services/databaseService';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';

export class SuperAdminController {
  /**
   * Create admin user (super admin only)
   */
  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;
      const user = req.user!;

      // Only super admins can create admins
      if (user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        });
        return;
      }

      // Validate email format
      if (!SecurityService.isValidEmail(email)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_EMAIL,
        });
        return;
      }

      // Validate password strength
      if (!PasswordService.isValidPassword(password)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.WEAK_PASSWORD,
        });
        return;
      }

      // Check if user already exists
      const existingUser = await DatabaseService.findUserByEmail(email);
      if (existingUser) {
        res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: ERROR_MESSAGES.USER_ALREADY_EXISTS,
        });
        return;
      }

      // Hash password
      const passwordHash = await PasswordService.hashPassword(password);

      // Create admin user
      const adminData = {
        email: SecurityService.sanitizeInput(email.toLowerCase()),
        password: passwordHash,
        role: 'admin' as const,
        firstName: SecurityService.sanitizeInput(firstName),
        lastName: SecurityService.sanitizeInput(lastName),
      };

      const admin = await DatabaseService.createUser(adminData);

      // Return admin info (without password)
      const adminResponse = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: adminResponse,
        message: 'Admin user created successfully',
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to create admin user',
      });
    }
  }
}