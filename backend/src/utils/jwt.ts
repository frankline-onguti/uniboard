import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../../../shared/types';
import { JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, ERROR_MESSAGES } from './constants';

export class JWTService {
  private static accessSecret = process.env.JWT_SECRET || 'dev-access-secret';
  private static refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

  /**
   * Generate access token (short-lived)
   * Contains user claims for authorization
   */
  static generateAccessToken(userId: string, email: string, role: UserRole): string {
    const payload: JWTPayload = {
      userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
      issuer: 'uniboard-api',
      audience: 'uniboard-client',
    });
  }

  /**
   * Generate refresh token (long-lived)
   * Used only for token refresh, no user claims
   */
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.refreshSecret,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'uniboard-api',
        audience: 'uniboard-client',
      }
    );
  }

  /**
   * Verify and decode access token
   * Returns user claims for authorization
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessSecret, {
        issuer: 'uniboard-api',
        audience: 'uniboard-client',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  /**
   * Verify refresh token
   * Returns userId for token refresh
   */
  static verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: 'uniboard-api',
        audience: 'uniboard-client',
      }) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Check if token is expired (without verification)
   * Used for client-side token refresh logic
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) {
        return true;
      }
      return decoded.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded?.exp || null;
    } catch {
      return null;
    }
  }
}