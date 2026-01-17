import { Router } from 'express';
import { SuperAdminController } from '../controllers/superAdminController';
import { authenticate, requireSuperAdmin } from '../middlewares/auth';
import { validateCreateAdmin } from '../middlewares/superAdminValidation';

const router = Router();

/**
 * @route   POST /api/admins
 * @desc    Create admin user (super admin only)
 * @access  Private (super admin role required)
 */
router.post('/', authenticate, requireSuperAdmin, validateCreateAdmin, SuperAdminController.createAdmin);

export default router;