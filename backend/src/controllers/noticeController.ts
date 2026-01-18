import { Request, Response } from 'express';
import { NoticeService } from '../services/noticeService';
import { HTTP_STATUS } from '../utils/constants';
import { NoticeFilters } from '../models/Notice';

export class NoticeController {
  /**
   * Get notices (accessible to students and admins)
   * Students see only active, non-expired notices
   * Admins see all notices
   */
  static async getNotices(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const category = req.query.category as string;
      const search = req.query.search as string;

      // Build filters based on user role
      const filters: NoticeFilters = {
        ...(category && { category: category as any }),
        ...(search && { search }),
      };

      // Students only see active, non-expired notices
      if (user.role === 'student') {
        filters.isActive = true;
        filters.includeExpired = false;
      }

      // Admins can see all notices (including inactive/expired)
      if (user.role === 'admin' || user.role === 'super_admin') {
        if (req.query.active !== undefined) {
          filters.isActive = req.query.active === 'true';
        }
        if (req.query.includeExpired !== undefined) {
          filters.includeExpired = req.query.includeExpired === 'true';
        }
      }

      const result = await NoticeService.getNotices(filters, { page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get notices error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch notices',
      });
    }
  }

  /**
   * Get single notice by ID
   */
  static async getNoticeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      if (!id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Notice ID is required',
        });
        return;
      }

      const notice = await NoticeService.getNoticeById(id);

      if (!notice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Notice not found',
        });
        return;
      }

      // Students can only see active, non-expired notices
      if (user.role === 'student') {
        if (!notice.isActive || (notice.expiresAt && new Date() > notice.expiresAt)) {
          res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: 'Notice not found',
          });
          return;
        }
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: notice,
      });
    } catch (error) {
      console.error('Get notice by ID error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch notice',
      });
    }
  }

  /**
   * Create new notice (admin only)
   */
  static async createNotice(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { title, content, category, expiresAt } = req.body;

      // Only admins can create notices
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Only admins can create notices',
        });
        return;
      }

      const noticeData = {
        title,
        content,
        category,
        createdBy: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      const notice = await NoticeService.createNotice(noticeData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: notice,
        message: 'Notice created successfully',
      });
    } catch (error) {
      console.error('Create notice error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to create notice',
      });
    }
  }

  /**
   * Update notice (admin only)
   */
  static async updateNotice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const { title, content, category, expiresAt, isActive } = req.body;

      if (!id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Notice ID is required',
        });
        return;
      }

      // Only admins can update notices
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Only admins can update notices',
        });
        return;
      }

      // Check if notice exists
      const existingNotice = await NoticeService.getNoticeById(id);
      if (!existingNotice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Notice not found',
        });
        return;
      }

      const updateData = {
        title,
        content,
        category,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive,
      };

      const updatedNotice = await NoticeService.updateNotice(id, updateData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedNotice,
        message: 'Notice updated successfully',
      });
    } catch (error) {
      console.error('Update notice error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update notice',
      });
    }
  }

  /**
   * Delete notice (admin only)
   */
  static async deleteNotice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      if (!id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Notice ID is required',
        });
        return;
      }

      // Only admins can delete notices
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Only admins can delete notices',
        });
        return;
      }

      // Check if notice exists
      const existingNotice = await NoticeService.getNoticeById(id);
      if (!existingNotice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Notice not found',
        });
        return;
      }

      // Check if notice has applications
      const hasApplications = await NoticeService.hasApplications(id);
      if (hasApplications) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Cannot delete notice with existing applications',
        });
        return;
      }

      await NoticeService.deleteNotice(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notice deleted successfully',
      });
    } catch (error) {
      console.error('Delete notice error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to delete notice',
      });
    }
  }
}