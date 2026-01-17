import { database } from '../database/connection';
import { Notice as NoticeType, User } from '../../../shared/types';

export interface NoticeModel {
  id: string;
  title: string;
  content: string;
  category: string;
  createdBy: string;
  expiresAt?: Date;
  isActive: boolean;
  priority: number;
  attachmentUrl?: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoticeData {
  title: string;
  content: string;
  category: string;
  createdBy: string;
  expiresAt?: Date;
  priority?: number;
  attachmentUrl?: string;
}

export interface UpdateNoticeData {
  title?: string;
  content?: string;
  category?: string;
  expiresAt?: Date;
  isActive?: boolean;
  priority?: number;
  attachmentUrl?: string;
}

export interface NoticeQueryOptions {
  limit?: number;
  offset?: number;
  category?: string;
  isActive?: boolean;
  search?: string;
  createdBy?: string;
  includeExpired?: boolean;
  sortBy?: 'created_at' | 'priority' | 'title' | 'expires_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface NoticeWithAuthor extends NoticeModel {
  author: Pick<User, 'firstName' | 'lastName' | 'email'>;
}

export class NoticeRepository {
  /**
   * Create a new notice
   */
  static async create(data: CreateNoticeData): Promise<NoticeModel> {
    const result = await database.query(
      `INSERT INTO notices (title, content, category, created_by, expires_at, priority, attachment_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.title,
        data.content,
        data.category,
        data.createdBy,
        data.expiresAt || null,
        data.priority || 0,
        data.attachmentUrl || null,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find notice by ID
   */
  static async findById(id: string): Promise<NoticeModel | null> {
    const result = await database.query(
      'SELECT * FROM notices WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find notice by ID with author information
   */
  static async findByIdWithAuthor(id: string): Promise<NoticeWithAuthor | null> {
    const result = await database.query(
      `SELECT n.*, u.first_name, u.last_name, u.email
       FROM notices n
       JOIN users u ON n.created_by = u.id
       WHERE n.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const notice = this.mapRowToModel(row);
    
    return {
      ...notice,
      author: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
      },
    };
  }

  /**
   * Find notices with filtering and pagination
   */
  static async findMany(options: NoticeQueryOptions = {}): Promise<{
    notices: NoticeModel[];
    total: number;
  }> {
    const {
      limit = 20,
      offset = 0,
      category,
      isActive = true,
      search,
      createdBy,
      includeExpired = false,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (isActive !== undefined) {
      whereConditions.push(`n.is_active = $${paramIndex++}`);
      queryParams.push(isActive);
    }

    if (category) {
      whereConditions.push(`n.category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (createdBy) {
      whereConditions.push(`n.created_by = $${paramIndex++}`);
      queryParams.push(createdBy);
    }

    if (!includeExpired) {
      whereConditions.push(`(n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`);
    }

    if (search) {
      whereConditions.push(`(
        n.title ILIKE $${paramIndex} OR 
        n.content ILIKE $${paramIndex} OR
        to_tsvector('english', n.title || ' ' || n.content) @@ plainto_tsquery('english', $${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.leng