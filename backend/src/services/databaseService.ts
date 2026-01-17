import { Pool, PoolClient } from 'pg';
import pool from '../database/connection';
import { UserModel, CreateUserData } from '../models/User';
import { UserRole } from '../../../shared/types';

export class DatabaseService {
  /**
   * Get database client from pool
   */
  static async getClient(): Promise<PoolClient> {
    return pool.connect();
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
   * Get all users
   */
  static async getAllUsers(): Promise<UserModel[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      
      return result.rows.map(row => ({
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role as UserRole,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Count super admins
   */
  static async countSuperAdmins(): Promise<number> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['super_admin']
      );
      
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Log role change for audit
   */
  static async logRoleChange(
    changedBy: string, 
    targetUserId: string, 
    oldRole: UserRole, 
    newRole: UserRole
  ): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `INSERT INTO role_change_logs (changed_by, target_user_id, old_role, new_role, changed_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [changedBy, targetUserId, oldRole, newRole]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    } finally {
      client.release();
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: UserRole): Promise<UserModel> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `UPDATE users 
         SET role = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [role, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
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
   * Close database connection
   */
  static async close(): Promise<void> {
    // Connection is managed by the pool in database/connection.ts
    // This method is kept for compatibility
  }
}