import { UserRole } from '../../../shared/types';

// Authentication constants
export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';
export const BCRYPT_SALT_ROUNDS = 12;

// Role constants (no magic strings)
export const USER_ROLES: UserRole[] = ['student', 'admin', 'super_admin'] as const;

// Validation constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const STUDENT_ID_REGEX = /^[A-Z0-9]{6,12}$/;

// Database constants
export const DB_TIMEOUT = 30000; // 30 seconds
export const MAX_CONNECTIONS = 20;

// Security constants
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  STUDENT_ID_EXISTS: 'Student ID already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INVALID_ROLE: 'Invalid user role',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_STUDENT_ID: 'Student ID must be 6-12 alphanumeric characters',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
} as const;