import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { HTTP_STATUS } from '../utils/constants';
import { NOTICE_CATEGORIES } from '../models/Notice';

/**
 * Notice creation validation schema
 */
const createNoticeSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Title is required',
      'string.max': 'Title must be less than 255 characters',
      'any.required': 'Title is required',
    }),
  
  content: Joi.string()
    .trim()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Content is required',
      'string.max': 'Content must be less than 10,000 characters',
      'any.required': 'Content is required',
    }),
  
  category: Joi.string()
    .valid(...NOTICE_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${NOTICE_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
  
  expiresAt: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Expiry date must be in the future',
      'date.iso': 'Expiry date must be a valid ISO date',
    }),
});

/**
 * Notice update validation schema
 */
const updateNoticeSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title must be less than 255 characters',
    }),
  
  content: Joi.string()
    .trim()
    .min(1)
    .max(10000)
    .optional()
    .messages({
      'string.min': 'Content cannot be empty',
      'string.max': 'Content must be less than 10,000 characters',
    }),
  
  category: Joi.string()
    .valid(...NOTICE_CATEGORIES)
    .optional()
    .messages({
      'any.only': `Category must be one of: ${NOTICE_CATEGORIES.join(', ')}`,
    }),
  
  expiresAt: Joi.date()
    .iso()
    .optional()
    .allow(null)
    .messages({
      'date.iso': 'Expiry date must be a valid ISO date',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean',
    }),
});

/**
 * Validate notice creation request
 */
export const validateCreateNotice = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = createNoticeSchema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: error.details[0].message,
    });
    return;
  }
  
  next();
};

/**
 * Validate notice update request
 */
export const validateUpdateNotice = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = updateNoticeSchema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: error.details[0].message,
    });
    return;
  }
  
  next();
};

/**
 * Validate notice query parameters
 */
export const validateNoticeQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { category, active, includeExpired, page, limit } = req.query;
  
  // Validate category if provided
  if (category && !NOTICE_CATEGORIES.includes(category as any)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: `Invalid category. Must be one of: ${NOTICE_CATEGORIES.join(', ')}`,
    });
    return;
  }
  
  // Validate boolean parameters
  if (active && !['true', 'false'].includes(active as string)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'active parameter must be true or false',
    });
    return;
  }
  
  if (includeExpired && !['true', 'false'].includes(includeExpired as string)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'includeExpired parameter must be true or false',
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