import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { validateRegistration, validateLogin } from '../middlewares/validation';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new student user
 * @access  Public
 */
router.post('/register', validateRegistration, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (all roles)
 * @access  Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token cookie)
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, AuthController.me);

export default router;