import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate, requireStudent, requireAdminOrSuperAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @route   GET /api/dashboard/student
 * @desc    Get student dashboard summary statistics
 * @access  Private (student role required)
 */
router.get('/student', (req, res, next) => {
  console.log('Dashboard student route hit');
  next();
}, authenticate, requireStudent, DashboardController.getStudentDashboard);

/**
 * @route   GET /api/dashboard/debug
 * @desc    Debug endpoint to check database contents
 * @access  Private (authenticated users)
 */
router.get('/debug', authenticate, DashboardController.debugDatabase);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard summary statistics
 * @access  Private (admin role required)
 */
router.get('/admin', authenticate, requireAdminOrSuperAdmin, DashboardController.getAdminDashboard);

export default router;