import { Request, Response } from 'express';
import { NoticeService } from '../services/noticeService';
import { ApplicationService } from '../services/applicationService';
import { HTTP_STATUS } from '../utils/constants';

export class DashboardController {
  /**
   * Get student dashboard summary statistics
   * Returns aggregated counts for dashboard widgets
   */
  static async getStudentDashboard(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      console.log('Dashboard request from user:', user.id, user.role);

      // Disable caching for dashboard data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Only students can access this endpoint
      if (user.role !== 'student') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Only students can access student dashboard',
        });
        return;
      }

      console.log('Fetching dashboard stats for student:', user.id);

      // Fetch all dashboard stats in parallel for performance
      const [activeNotices, totalApplications, approvedApplications] = await Promise.all([
        // Count active notices visible to students
        NoticeService.getActiveNoticesCount(),
        
        // Count student's total applications
        ApplicationService.getStudentApplicationsCount(user.id),
        
        // Count student's approved applications
        ApplicationService.getStudentApplicationsCount(user.id, 'approved'),
      ]);

      console.log('Dashboard stats:', { activeNotices, totalApplications, approvedApplications });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          activeNotices,
          totalApplications,
          approvedApplications,
        },
      });
    } catch (error) {
      console.error('Get student dashboard error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  }

  /**
   * Debug endpoint to check database contents
   */
  static async debugDatabase(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      
      // Import pool directly for debugging
      const pool = require('../database/connection').default;
      const client = await pool.connect();
      
      try {
        // Check notices
        const noticesResult = await client.query('SELECT id, title, is_active, expires_at FROM notices');
        
        // Check applications for this user
        const applicationsResult = await client.query('SELECT id, notice_id, status FROM applications WHERE student_id = $1', [user.id]);
        
        res.json({
          success: true,
          debug: {
            userId: user.id,
            notices: noticesResult.rows,
            applications: applicationsResult.rows,
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Debug database error:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get admin dashboard summary statistics
   * Returns aggregated counts for admin dashboard widgets
   */
  static async getAdminDashboard(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      // Only admins can access this endpoint
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Only admins can access admin dashboard',
        });
        return;
      }

      // Fetch all dashboard stats in parallel for performance
      const [totalNotices, totalApplications, pendingApplications, approvedApplications] = await Promise.all([
        // Count all notices (including inactive)
        NoticeService.getTotalNoticesCount(),
        
        // Count all applications
        ApplicationService.getTotalApplicationsCount(),
        
        // Count pending applications
        ApplicationService.getApplicationsCountByStatus('pending'),
        
        // Count approved applications
        ApplicationService.getApplicationsCountByStatus('approved'),
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          totalNotices,
          totalApplications,
          pendingApplications,
          approvedApplications,
        },
      });
    } catch (error) {
      console.error('Get admin dashboard error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  }
}