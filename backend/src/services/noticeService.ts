import pool from '../database/connection';
import { NoticeModel, NoticeFilters, NoticeQueryResult, NoticeWithAuthor } from '../models/Notice';

export class NoticeService {
  /**
   * Get notices with filters and pagination
   */
  static async getNotices(
    filters: NoticeFilters = {},
    pagination: { page: number; limit: number }
  ): Promise<NoticeQueryResult> {
    const client = await pool.connect();
    
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (filters.category) {
        paramCount++;
        conditions.push(`n.category = $${paramCount}`);
        values.push(filters.category);
      }

      if (filters.isActive !== undefined) {
        paramCount++;
        conditions.push(`n.is_active = $${paramCount}`);
        values.push(filters.isActive);
      }

      if (filters.createdBy) {
        paramCount++;
        conditions.push(`n.created_by = $${paramCount}`);
        values.push(filters.createdBy);
      }

      if (filters.search) {
        paramCount++;
        conditions.push(`(n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`);
        values.push(`%${filters.search}%`);
      }

      // Handle expiration filter
      if (filters.includeExpired === false) {
        conditions.push(`(n.expires_at IS NULL OR n.expires_at > NOW())`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM notices n
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get notices with author information
      paramCount++;
      const noticesQuery = `
        SELECT 
          n.id,
          n.title,
          n.content,
          n.category,
          n.created_by,
          n.expires_at,
          n.is_active,
          n.created_at,
          n.updated_at,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          u.email as author_email
        FROM notices n
        LEFT JOIN users u ON n.created_by = u.id
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const noticesResult = await client.query(noticesQuery, values);

      const notices: NoticeWithAuthor[] = noticesResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        createdBy: row.created_by,
        expiresAt: row.expires_at,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        author: {
          firstName: row.author_first_name,
          lastName: row.author_last_name,
          email: row.author_email,
        },
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        notices,
        total,
        page,
        limit,
        totalPages,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get single notice by ID
   */
  static async getNoticeById(id: string): Promise<NoticeWithAuthor | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          n.id,
          n.title,
          n.content,
          n.category,
          n.created_by,
          n.expires_at,
          n.is_active,
          n.created_at,
          n.updated_at,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          u.email as author_email
        FROM notices n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.id = $1
      `;

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        createdBy: row.created_by,
        expiresAt: row.expires_at,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        author: {
          firstName: row.author_first_name,
          lastName: row.author_last_name,
          email: row.author_email,
        },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create new notice
   */
  static async createNotice(data: CreateNoticeData): Promise<NoticeWithAuthor> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO notices (title, content, category, created_by, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        data.title,
        data.content,
        data.category,
        data.createdBy,
        data.expiresAt || null,
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];

      // Get the notice with author information
      return this.getNoticeById(row.id);
    } finally {
      client.release();
    }
  }

  /**
   * Update notice
   */
  static async updateNotice(id: string, data: UpdateNoticeData): Promise<NoticeWithAuthor | null> {
    const client = await pool.connect();
    
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (data.title !== undefined) {
        paramCount++;
        updates.push(`title = $${paramCount}`);
        values.push(data.title);
      }

      if (data.content !== undefined) {
        paramCount++;
        updates.push(`content = $${paramCount}`);
        values.push(data.content);
      }

      if (data.category !== undefined) {
        paramCount++;
        updates.push(`category = $${paramCount}`);
        values.push(data.category);
      }

      if (data.expiresAt !== undefined) {
        paramCount++;
        updates.push(`expires_at = $${paramCount}`);
        values.push(data.expiresAt);
      }

      if (data.isActive !== undefined) {
        paramCount++;
        updates.push(`is_active = $${paramCount}`);
        values.push(data.isActive);
      }

      if (updates.length === 0) {
        return this.getNoticeById(id);
      }

      paramCount++;
      const query = `
        UPDATE notices 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;
      values.push(id);

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.getNoticeById(id);
    } finally {
      client.release();
    }
  }

  /**
   * Delete notice
   */
  static async deleteNotice(id: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = 'DELETE FROM notices WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Check if notice has applications
   */
  static async hasApplications(noticeId: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = 'SELECT COUNT(*) as count FROM applications WHERE notice_id = $1';
      const result = await client.query(query, [noticeId]);
      return parseInt(result.rows[0].count) > 0;
    } finally {
      client.release();
    }
  }
}

  /**
   * Check if notice is available for applications
   */
  static async isNoticeAvailable(noticeId: string): Promise<boolean> {
    const notice = await this.getNoticeById(noticeId);
    
    if (!notice || !notice.isActive) {
      return false;
    }

    // Check if notice has expired
    if (notice.expiresAt && new Date() > notice.expiresAt) {
      return false;
    }

    return true;
  }