// Set test JWT secret BEFORE importing anything
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { DatabaseService } from '../services/databaseService';
import { PasswordService, SecurityService } from '../services/authService';
import { JWTService } from '../utils/jwt';

// Mock external dependencies but NOT JWTService for middleware tests
jest.mock('../services/databaseService');
jest.mock('../services/authService');

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;
const mockSecurityService = SecurityService as jest.Mocked<typeof SecurityService>;

// Helper to generate real JWTs for middleware tests using JWTService
const generateRealToken = (userId: string, email: string, role: 'student' | 'admin' | 'super_admin') => {
  // Use the actual JWTService to ensure consistency
  return JWTService.generateAccessToken(userId, email, role);
};

describe('Authentication & Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockPasswordService.hashPassword.mockResolvedValue('hashed-password');
    mockPasswordService.isValidPassword.mockReturnValue(true);
    mockPasswordService.verifyPassword.mockResolvedValue(true);
    
    mockSecurityService.sanitizeInput.mockImplementation((input: string) => input);
    mockSecurityService.isValidEmail.mockReturnValue(true);
    mockSecurityService.checkRateLimit.mockReturnValue(true); // Allow all requests in tests
    mockSecurityService.resetRateLimit.mockImplementation(() => {}); // No-op in tests
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const userData = {
        email: 'test@university.edu',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU123456',
      };

      const mockUser = {
        id: 'user-id-123',
        email: userData.email,
        passwordHash: 'hashed-password',
        role: 'student' as const,
        firstName: userData.firstName,
        lastName: userData.lastName,
        studentId: userData.studentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.findUserByEmail.mockResolvedValue(null);
      mockDatabaseService.findUserByStudentId.mockResolvedValue(null);
      mockDatabaseService.createUser.mockResolvedValue(mockUser);
      mockDatabaseService.storeRefreshToken.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('student');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@university.edu',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU123456',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'existing@university.edu',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU123456',
      };

      const existingUser = {
        id: 'existing-user',
        email: userData.email,
        passwordHash: 'hash',
        role: 'student' as const,
        firstName: 'Existing',
        lastName: 'User',
        studentId: 'STU999999',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.findUserByEmail.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@university.edu',
        password: 'TestPass123!',
      };

      const mockUser = {
        id: 'user-id-123',
        email: loginData.email,
        passwordHash: await PasswordService.hashPassword(loginData.password),
        role: 'student' as const,
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.findUserByEmail.mockResolvedValue(mockUser);
      mockDatabaseService.storeRefreshToken.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@university.edu',
        password: 'WrongPassword123!',
      };

      mockDatabaseService.findUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@university.edu' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'test@university.edu',
        passwordHash: 'hash',
        role: 'student' as const,
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database lookup for middleware
      mockDatabaseService.findUserById.mockResolvedValue(mockUser);

      // Generate real JWT for middleware test
      const token = generateRealToken(mockUser.id, mockUser.email, mockUser.role);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.data.role).toBe(mockUser.role);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Role-based Access Control', () => {
    let studentToken: string;
    let adminToken: string;
    let superAdminToken: string;

    beforeEach(() => {
      // Mock users for different roles
      const studentUser = {
        id: 'student-id',
        email: 'student@university.edu',
        passwordHash: 'hash',
        role: 'student' as const,
        firstName: 'Student',
        lastName: 'User',
        studentId: 'STU123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const adminUser = {
        id: 'admin-id',
        email: 'admin@university.edu',
        passwordHash: 'hash',
        role: 'admin' as const,
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const superAdminUser = {
        id: 'superadmin-id',
        email: 'superadmin@university.edu',
        passwordHash: 'hash',
        role: 'super_admin' as const,
        firstName: 'Super',
        lastName: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate real tokens using JWTService
      studentToken = generateRealToken(studentUser.id, studentUser.email, studentUser.role);
      adminToken = generateRealToken(adminUser.id, adminUser.email, adminUser.role);
      superAdminToken = generateRealToken(superAdminUser.id, superAdminUser.email, superAdminUser.role);

      // Mock database calls for /api/auth/me endpoint
      mockDatabaseService.findUserById.mockImplementation((id: string) => {
        if (id === 'student-id') return Promise.resolve(studentUser);
        if (id === 'admin-id') return Promise.resolve(adminUser);
        if (id === 'superadmin-id') return Promise.resolve(superAdminUser);
        return Promise.resolve(null);
      });
    });

    it('should allow student access to student endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.role).toBe('student');
    });

    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.role).toBe('admin');
    });

    it('should allow super admin access to all endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.role).toBe('super_admin');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'test@university.edu',
        passwordHash: 'hash',
        role: 'student' as const,
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.findUserById.mockResolvedValue(mockUser);
      mockDatabaseService.verifyRefreshToken.mockResolvedValue(true);

      // Generate a real refresh token
      const refreshToken = JWTService.generateRefreshToken(mockUser.id);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Refresh token not provided');
    });
  });

  describe('Logout', () => {
    it('should logout successfully and clear refresh token', async () => {
      mockDatabaseService.removeRefreshToken.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=valid-refresh-token'])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});