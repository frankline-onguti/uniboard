import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { HTTP_STATUS } from '../utils/constants';

/**
 * Application creation validation schema
 */
const createApplicationSchema = Joi.object({
  noticeId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Notice ID must be a valid UUID',
      'any.required': 'Notice ID is required',
    }),
  
  applicationData: Joi.object()
    .optional()
    .messages({
      'object.base': 'Application data must be an object',
    }),
});

/**
 * Validate application creation request
 */
export const validateCreateApplication = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = createApplicationSchema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: error.details?.[0]?.message || 'Validation error',
    });
    return;
  }
  
  next();
};

/**
 * Validate application query parameters
 */
export const validateApplicationQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { status, page, limit } = req.query;
  
  // Validate status if provided
  if (status && !['pending', 'approved', 'rejected'].includes(status as string)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Invalid status. Must be one of: pending, approved, rejected',
    });
    return;
  }
  
  // Validate pagination parameters
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Page must be a positive integer',
    });
    return;
  }
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Limit must be between 1 and 100',
    });
    return;
  }
  
  next();
};