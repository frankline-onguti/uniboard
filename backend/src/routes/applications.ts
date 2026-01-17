import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authenticate, requireStudent } from '../middlewares/auth';
import { validateUUID } from '../middlewares/validation';

const router = Router();

/**
 * @route   POST /api/applications
 * @desc    Submit application for a notice (students only)
 * @access  Private (student role required)
 */
router.post('/', authenticate, requireStudent, ApplicationController.createApplication);

/**
 * @route   GET /api/applications/me
 * @desc    Get current student's applications
 * @access  Private (student role required)
 */
router.get('/me', authenticate, requireStudent, ApplicationController.getMyApplications);

/**
 * @route   GET /api/applications/:id
 * @desc    Get single application by ID (students see own only)
 * @access  Private (requires authentication)
 */
router.get('/:id', authenticate, validateUUID('id'), ApplicationController.getApplicationById);

export default router;