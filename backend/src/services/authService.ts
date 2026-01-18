import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS, PASSWORD_REGEX, ERROR_MESSAGES } from '../utils/constants';

export class PasswordService {
  /**
   * Hash password using bcrypt with secure salt rounds
   * NEVER store plaintext passwords
   */
  static async hashPassword(password: string): Promise<string> {
    if (!this.isValidPassword(password)) {
      throw new Error(ERROR_MESSAGES.WEAK_PASSWORD);
    }
    
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   * Constant-time comparison to prevent timing attacks
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      // Log error but don't expose details
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Validate password strength
   * Must contain: uppercase, lowercase, number, special character
   */
  static isValidPassword(password: string): boolean {
    if (!password || password.length < 8) {
      return false;
    }
    
    return PASSWORD_REGEX.test(password);
  }

  /**
   * Generate secure random password for admin creation
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // Special
    
    // Fill remaining length
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

/**
 * Security utilities for authentication
 */
export class SecurityService {
  /**
   * Sanitize user input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Rate limiting helper - track login attempts
   */
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    // Disable rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier);

    if (!attempts) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window expired
    if (now - attempts.lastAttempt > windowMs) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (attempts.count >= maxAttempts) {
      return false;
    }

    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }

  static resetRateLimit(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }
}