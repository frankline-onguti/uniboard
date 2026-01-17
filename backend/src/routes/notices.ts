import { Router } from 'express';
import { NoticeController } from '../controllers/noticeController';
import { authenticate } from '../middlewares/auth';
import { validateUUID } from '../middlewares/validation';

const router = Router();

/**
 * @route   GET /api/notices
 * @desc    Get notices (students see active only, admins see all)
 * @access  Private (requires authentication)
 */
router.get('/', authenticate, NoticeController.getNotices);

/**
 * @route   GET /api/notices/:id
 * @desc    Get single notice by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', authenticate, validateUUID('id'), NoticeController.getNoticeById);

export default router;