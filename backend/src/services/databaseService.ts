import { Pool, PoolClient } from 'pg';
import { UserModel, CreateUserData } from '../models/User';
import { UserRole } from '../../../shared/types';

export class DatabaseService {
  private static pool: Pool;

  static initialize(): void {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'uniboard',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  static async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string): Promise<UserModel | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find user by ID
   */
  static async findUserById(id: string): Promise<UserModel | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find user by student ID
   */
  static async findUserByStudentId(studentId: string): Promise<UserModel | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE student_id = $1',
        [studentId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData: CreateUserData): Promise<UserModel> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, student_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userData.email,
          userData.password,
          userData.role,
          userData.firstName,
          userData.lastName,
          userData.studentId || null,
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    const client = await this.getClient();
    try {
      // Remove existing refresh tokens for this user
      await client.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [userId]
      );

      // Store new refresh token
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [
          userId,
          tokenHash,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()',
        [userId, tokenHash]
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Remove refresh token
   */
  static async removeRefreshToken(tokenHash: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        'DELETE FROM refresh_tokens WHERE token_hash = $1',
        [tokenHash]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup expired refresh tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}