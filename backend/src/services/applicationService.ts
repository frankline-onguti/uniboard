import pool from '../database/connection';
import { 
  ApplicationModel, 
  CreateApplicationData, 
  ApplicationFilters, 
  ApplicationQueryResult,
  ApplicationWithRelations 
} from '../models/Application';

export class ApplicationService {
  /**
   * Create new application
   */
  static async createApplication(data: CreateApplicationData): Promise<ApplicationModel> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO applications (notice_id, student_id, application_data)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const values = [
        data.noticeId,
        data.studentId,
        JSON.stringify(data.applicationData || {}),
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];

      return {
        id: row.id,
        noticeId: row.notice_id,
        studentId: row.student_id,
        status: row.status,
        applicationData: row.application_data,
        adminNotes: row.admin_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get application by notice and student (to check for duplicates)
   */
  static async getApplicationByNoticeAndStudent(
    noticeId: string, 
    studentId: string
  ): Promise<ApplicationModel | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT * FROM applications 
        WHERE notice_id = $1 AND student_id = $2
      `;

      const result = await client.query(query, [noticeId, studentId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        noticeId: row.notice_id,
        studentId: row.student_id,
        status: row.status,
        applicationData: row.application_data,
        adminNotes: row.admin_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get applications with filters and pagination
   */
  static async getApplications(
    filters: ApplicationFilters = {},
    pagination: { page: number; limit: number }
  ): Promise<ApplicationQueryResult> {
    const client = await pool.connect();
    
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        conditions.push(`a.status = $${paramCount}`);
        values.push(filters.status);
      }

      if (filters.noticeId) {
        paramCount++;
        conditions.push(`a.notice_id = $${paramCount}`);
        values.push(filters.noticeId);
      }

      if (filters.studentId) {
        paramCount++;
        conditions.push(`a.student_id = $${paramCount}`);
        values.push(filters.studentId);
      }

      if (filters.reviewedBy) {
        paramCount++;
        conditions.push(`a.reviewed_by = $${paramCount}`);
        values.push(filters.reviewedBy);
      }

      if (filters.dateFrom) {
        paramCount++;
        conditions.push(`a.created_at >= $${paramCount}`);
        values.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        paramCount++;
        conditions.push(`a.created_at <= $${paramCount}`);
        values.push(filters.dateTo);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM applications a
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get applications with related data
      paramCount++;
      const applicationsQuery = `
        SELECT 
          a.*,
          n.title as notice_title,
          n.category as notice_category,
          n.expires_at as notice_expires_at,
          s.first_name as student_first_name,
          s.last_name as student_last_name,
          s.email as student_email,
          s.student_id as student_student_id,
          r.first_name as reviewer_first_name,
          r.last_name as reviewer_last_name,
          r.email as reviewer_email
        FROM applications a
        LEFT JOIN notices n ON a.notice_id = n.id
        LEFT JOIN users s ON a.student_id = s.id
        LEFT JOIN users r ON a.reviewed_by = r.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const applicationsResult = await client.query(applicationsQuery, values);

      const applications: ApplicationModel[] = applicationsResult.rows.map(row => ({
        id: row.id,
        noticeId: row.notice_id,
        studentId: row.student_id,
        status: row.status,
        applicationData: row.application_data,
        adminNotes: row.admin_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        applications,
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
   * Get single application by ID with relations
   */
  static async getApplicationById(id: string): Promise<ApplicationWithRelations | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          a.*,
          n.title as notice_title,
          n.category as notice_category,
          n.expires_at as notice_expires_at,
          s.first_name as student_first_name,
          s.last_name as student_last_name,
          s.email as student_email,
          s.student_id as student_student_id,
          r.first_name as reviewer_first_name,
          r.last_name as reviewer_last_name,
          r.email as reviewer_email
        FROM applications a
        LEFT JOIN notices n ON a.notice_id = n.id
        LEFT JOIN users s ON a.student_id = s.id
        LEFT JOIN users r ON a.reviewed_by = r.id
        WHERE a.id = $1
      `;

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        noticeId: row.notice_id,
        studentId: row.student_id,
        status: row.status,
        applicationData: row.application_data,
        adminNotes: row.admin_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        notice: {
          title: row.notice_title,
          category: row.notice_category,
          expiresAt: row.notice_expires_at,
        },
        student: {
          firstName: row.student_first_name,
          lastName: row.student_last_name,
          email: row.student_email,
          studentId: row.student_student_id,
        },
        reviewer: row.reviewer_first_name ? {
          firstName: row.reviewer_first_name,
          lastName: row.reviewer_last_name,
          email: row.reviewer_email,
        } : undefined,
      };
    } finally {
      client.release();
    }
  }
}