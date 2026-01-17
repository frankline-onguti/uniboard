import { Router } from 'express';
import { SuperAdminController } from '../controllers/superAdminController';
import { authenticate, requireSuperAdmin } from '../middlewares/auth';
import { validateCreateAdmin, validateRoleChange } from '../middlewares/superAdminValidation';
import { validateUUID } from '../middlewares/validation';

const router = Router();

/**
 * @route   POST /api/admins
 * @desc    Create admin user (super admin only)
 * @access  Private (super admin role required)
 */
router.post('/admins', authenticate, requireSuperAdmin, validateCreateAdmin, SuperAdminController.createAdmin);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Change user role (super admin only)
 * @access  Private (super admin role required)
 */
router.patch('/users/:id/role', authenticate, requireSuperAdmin, validateUUID('id'), validateRoleChange, SuperAdminController.changeUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (super admin only)
 * @access  Private (super admin role required)
 */
router.delete('/users/:id', authenticate, requireSuperAdmin, validateUUID('id'), SuperAdminController.deleteUser);

export default router;