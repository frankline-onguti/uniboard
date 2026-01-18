import { Request, Response } from 'express';
import { ApplicationService } from '../services/applicationService';
import { NoticeService } from '../services/noticeService';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { requireParam } from '../utils/validation';

export class ApplicationController {
  /**
   * Submit application for a notice (students only)
   */
  static async createApplication(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { noticeId, applicationData } = req.body;

      // Validate required fields
      if (!noticeId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Notice ID is required',
        });
        return;
      }

      // Only students can apply
      if (user.role !== 'student') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Only students can submit applications',
        });
        return;
      }

      // Check if notice exists and is available for applications
      const isAvailable = await NoticeService.isNoticeAvailable(noticeId);
      if (!isAvailable) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Notice is not available for applications',
        });
        return;
      }

      // Check if student has already applied
      const existingApplication = await ApplicationService.getApplicationByNoticeAndStudent(
        noticeId,
        user.id
      );

      if (existingApplication) {
        res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'You have already applied for this opportunity',
        });
        return;
      }

      // Create application
      const application = await ApplicationService.createApplication({
        noticeId,
        studentId: user.id,
        applicationData: applicationData || {},
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: application,
        message: 'Application submitted successfully',
      });
    } catch (error) {
      console.error('Create application error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to submit application',
      });
    }
  }

  /**
   * Get student's own applications
   */
  static async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const status = req.query.status as string;

      // Only students can access this endpoint
      if (user.role !== 'student') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      const filters = {
        studentId: user.id,
        ...(status && { status: status as any }),
      };

      const result = await ApplicationService.getApplications(filters, { page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get my applications error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch applications',
      });
    }
  }

  /**
   * Get all applications (admin only)
   */
  static async getAllApplications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const status = req.query.status as string;
      const noticeId = req.query.noticeId as string;

      // Only admins can view all applications
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      const filters = {
        ...(status && { status: status as any }),
        ...(noticeId && { noticeId }),
      };

      const result = await ApplicationService.getApplications(filters, { page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get all applications error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch applications',
      });
    }
  }

  /**
   * Get single application by ID (student can only see their own)
   */
  static async getApplicationById(req: Request, res: Response): Promise<void> {
    try {
      const id = requireParam(req.params.id, 'id');
      const user = req.user!;

      const application = await ApplicationService.getApplicationById(id);

      if (!application) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Application not found',
        });
        return;
      }

      // Students can only see their own applications
      if (user.role === 'student' && application.studentId !== user.id) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Admins can see all applications (for future admin features)
      if (user.role !== 'student' && user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error('Get application by ID error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch application',
      });
    }
  }

  /**
   * Approve application (admin only)
   */
  static async approveApplication(req: Request, res: Response): Promise<void> {
    try {
      const id = requireParam(req.params.id, 'id');
      const user = req.user!;
      const { adminNotes } = req.body;

      // Only admins can approve applications
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Check if application exists
      const existingApplication = await ApplicationService.getApplicationById(id);
      if (!existingApplication) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Application not found',
        });
        return;
      }

      // Check if application is already processed
      if (existingApplication.status !== 'pending') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: `Application is already ${existingApplication.status}`,
        });
        return;
      }

      // Update application status
      const updatedApplication = await ApplicationService.updateApplicationStatus(
        id,
        'approved',
        user.id,
        adminNotes
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedApplication,
        message: 'Application approved successfully',
      });
    } catch (error) {
      console.error('Approve application error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to approve application',
      });
    }
  }

  /**
   * Reject application (admin only)
   */
  static async rejectApplication(req: Request, res: Response): Promise<void> {
    try {
      const id = requireParam(req.params.id, 'id');
      const user = req.user!;
      const { adminNotes } = req.body;

      // Only admins can reject applications
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Validate admin notes for rejection
      if (!adminNotes || adminNotes.trim().length === 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Admin notes are required when rejecting an application',
        });
        return;
      }

      // Check if application exists
      const existingApplication = await ApplicationService.getApplicationById(id);
      if (!existingApplication) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Application not found',
        });
        return;
      }

      // Check if application is already processed
      if (existingApplication.status !== 'pending') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: `Application is already ${existingApplication.status}`,
        });
        return;
      }

      // Update application status
      const updatedApplication = await ApplicationService.updateApplicationStatus(
        id,
        'rejected',
        user.id,
        adminNotes
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedApplication,
        message: 'Application rejected successfully',
      });
    } catch (error) {
      console.error('Reject application error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to reject application',
      });
    }
  }
}