import request from 'supertest';
import { app } from '../app';
import { DatabaseService } from '../services/databaseService';
import { PasswordService } from '../services/authService';

// Mock database service
jest.mock('../services/databaseService');
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

describe('Authentication & Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockDatabaseService.findUserById.mockResolvedValue(mockUser);

      // First login to get token
      mockDatabaseService.findUserByEmail.mockResolvedValue(mockUser);
      mockDatabaseService.storeRefreshToken.mockResolvedValue();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.edu',
          password: 'TestPass123!',
        });

      const token = loginResponse.body.data.accessToken;

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

    beforeEach(async () => {
      // Mock users for different roles
      const studentUser = {
        id: 'student-id',
        email: 'student@university.edu',
        passwordHash: await PasswordService.hashPassword('TestPass123!'),
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
        passwordHash: await PasswordService.hashPassword('TestPass123!'),
        role: 'admin' as const,
        firstName: 'Admin',
        lastName: 'User',
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const superAdminUser = {
        id: 'superadmin-id',
        email: 'superadmin@university.edu',
        passwordHash: await PasswordService.hashPassword('TestPass123!'),
        role: 'super_admin' as const,
        firstName: 'Super',
        lastName: 'Admin',
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.storeRefreshToken.mockResolvedValue();

      // Login as student
      mockDatabaseService.findUserByEmail.mockResolvedValue(studentUser);
      mockDatabaseService.findUserById.mockResolvedValue(studentUser);
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@university.edu', password: 'TestPass123!' });
      studentToken = studentLogin.body.data.accessToken;

      // Login as admin
      mockDatabaseService.findUserByEmail.mockResolvedValue(adminUser);
      mockDatabaseService.findUserById.mockResolvedValue(adminUser);
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@university.edu', password: 'TestPass123!' });
      adminToken = adminLogin.body.data.accessToken;

      // Login as super admin
      mockDatabaseService.findUserByEmail.mockResolvedValue(superAdminUser);
      mockDatabaseService.findUserById.mockResolvedValue(superAdminUser);
      const superAdminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'superadmin@university.edu', password: 'TestPass123!' });
      superAdminToken = superAdminLogin.body.data.accessToken;
    });

    it('should allow student access to student endpoints', async () => {
      mockDatabaseService.findUserById.mockResolvedValue({
        id: 'student-id',
        email: 'student@university.edu',
        passwordHash: 'hash',
        role: 'student',
        firstName: 'Student',
        lastName: 'User',
        studentId: 'STU123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.role).toBe('student');
    });

    it('should allow admin access to admin endpoints', async () => {
      mockDatabaseService.findUserById.mockResolvedValue({
        id: 'admin-id',
        email: 'admin@university.edu',
        passwordHash: 'hash',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.role).toBe('admin');
    });

    it('should allow super admin access to all endpoints', async () => {
      mockDatabaseService.findUserById.mockResolvedValue({
        id: 'superadmin-id',
        email: 'superadmin@university.edu',
        passwordHash: 'hash',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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

      // Mock refresh token in cookie
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token'])
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