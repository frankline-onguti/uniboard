import { Router } from 'express';
import { NoticeController } from '../controllers/noticeController';
import { authenticate, requireAdminOrSuperAdmin } from '../middlewares/auth';
import { validateUUID } from '../middlewares/validation';
import { validateCreateNotice, validateUpdateNotice, validateNoticeQuery } from '../middlewares/noticeValidation';

const router = Router();

/**
 * @route   GET /api/notices
 * @desc    Get notices (students see active only, admins see all)
 * @access  Private (requires authentication)
 */
router.get('/', authenticate, validateNoticeQuery, NoticeController.getNotices);

/**
 * @route   POST /api/notices
 * @desc    Create new notice (admin only)
 * @access  Private (admin role required)
 */
router.post('/', authenticate, requireAdminOrSuperAdmin, validateCreateNotice, NoticeController.createNotice);

/**
 * @route   GET /api/notices/:id
 * @desc    Get single notice by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', authenticate, validateUUID('id'), NoticeController.getNoticeById);

/**
 * @route   PUT /api/notices/:id
 * @desc    Update notice (admin only)
 * @access  Private (admin role required)
 */
router.put('/:id', authenticate, requireAdminOrSuperAdmin, validateUUID('id'), validateUpdateNotice, NoticeController.updateNotice);

/**
 * @route   DELETE /api/notices/:id
 * @desc    Delete notice (admin only)
 * @access  Private (admin role required)
 */
router.delete('/:id', authenticate, requireAdminOrSuperAdmin, validateUUID('id'), NoticeController.deleteNotice);

export default router;