import { Request, Response } from 'express';
import { PasswordService, SecurityService } from '../services/authService';
import { JWTService } from '../utils/jwt';
import { DatabaseService } from '../services/databaseService';
import { UserModel, UserPublic } from '../models/User';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../../shared/types';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';

export class AuthController {
  /**
   * Register new user (students only via public registration)
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, studentId }: RegisterRequest = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName || !studentId) {
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

      // Check if student ID already exists
      const existingStudentId = await DatabaseService.findUserByStudentId(studentId);
      if (existingStudentId) {
        res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: ERROR_MESSAGES.STUDENT_ID_EXISTS,
        });
        return;
      }

      // Hash password
      const passwordHash = await PasswordService.hashPassword(password);

      // Create user
      const userData = {
        email: SecurityService.sanitizeInput(email.toLowerCase()),
        password: passwordHash,
        role: 'student' as const,
        firstName: SecurityService.sanitizeInput(firstName),
        lastName: SecurityService.sanitizeInput(lastName),
        studentId: SecurityService.sanitizeInput(studentId.toUpperCase()),
      };

      const user = await DatabaseService.createUser(userData);

      // Generate tokens
      const accessToken = JWTService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = JWTService.generateRefreshToken(user.id);

      // Store refresh token
      await DatabaseService.storeRefreshToken(user.id, refreshToken);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data and access token
      const userPublic: UserPublic = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      const response: AuthResponse = {
        user: userPublic,
        accessToken,
      };

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: response,
        message: 'User registered successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }

  /**
   * Login user (all roles)
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate input
      if (!email || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        });
        return;
      }

      // Rate limiting
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      if (!SecurityService.checkRateLimit(clientIP)) {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          success: false,
          error: 'Too many login attempts. Please try again later.',
        });
        return;
      }

      // Find user
      const user = await DatabaseService.findUserByEmail(email.toLowerCase());
      if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
        return;
      }

      // Verify password
      const isValidPassword = await PasswordService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
        return;
      }

      // Reset rate limit on successful login
      SecurityService.resetRateLimit(clientIP);

      // Generate tokens
      const accessToken = JWTService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = JWTService.generateRefreshToken(user.id);

      // Store refresh token
      await DatabaseService.storeRefreshToken(user.id, refreshToken);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data and access token
      const userPublic: UserPublic = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      const response: AuthResponse = {
        user: userPublic,
        accessToken,
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Login failed',
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Refresh token not provided',
        });
        return;
      }

      // Verify refresh token
      const { userId } = JWTService.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const isValidRefreshToken = await DatabaseService.verifyRefreshToken(userId, refreshToken);
      if (!isValidRefreshToken) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      // Get user data
      const user = await DatabaseService.findUserById(userId);
      if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND,
        });
        return;
      }

      // Generate new access token
      const accessToken = JWTService.generateAccessToken(user.id, user.email, user.role);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { accessToken },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Token refresh failed',
      });
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        // Remove refresh token from database
        await DatabaseService.removeRefreshToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Get current user profile
   */
  static async me(req: Request, res: Response): Promise<void> {
    try {
      // User is attached by auth middleware
      const user = (req as any).user;

      const userPublic: UserPublic = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: userPublic,
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to get user profile',
      });
    }
  }
}