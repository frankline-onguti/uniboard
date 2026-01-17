import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { HTTP_STATUS, ERROR_MESSAGES, PASSWORD_REGEX, EMAIL_REGEX, STUDENT_ID_REGEX } from '../utils/constants';

/**
 * Validation middleware factory
 */
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }
    
    next();
  };
};

/**
 * Registration validation schema
 */
const registrationSchema = Joi.object({
  email: Joi.string()
    .pattern(EMAIL_REGEX)
    .required()
    .messages({
      'string.pattern.base': ERROR_MESSAGES.INVALID_EMAIL,
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': ERROR_MESSAGES.WEAK_PASSWORD,
      'any.required': 'Password is required',
    }),
  
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must be less than 100 characters',
      'any.required': 'First name is required',
    }),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must be less than 100 characters',
      'any.required': 'Last name is required',
    }),
  
  studentId: Joi.string()
    .pattern(STUDENT_ID_REGEX)
    .required()
    .messages({
      'string.pattern.base': ERROR_MESSAGES.INVALID_STUDENT_ID,
      'any.required': 'Student ID is required',
    }),
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .pattern(EMAIL_REGEX)
    .required()
    .messages({
      'string.pattern.base': ERROR_MESSAGES.INVALID_EMAIL,
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password is required',
      'any.required': 'Password is required',
    }),
});

/**
 * Create admin validation schema
 */
const createAdminSchema = Joi.object({
  email: Joi.string()
    .pattern(EMAIL_REGEX)
    .required()
    .messages({
      'string.pattern.base': ERROR_MESSAGES.INVALID_EMAIL,
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': ERROR_MESSAGES.WEAK_PASSWORD,
      'any.required': 'Password is required',
    }),
  
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must be less than 100 characters',
      'any.required': 'First name is required',
    }),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must be less than 100 characters',
      'any.required': 'Last name is required',
    }),
});

/**
 * Update user role validation schema
 */
const updateRoleSchema = Joi.object({
  role: Joi.string()
    .valid('student', 'admin', 'super_admin')
    .required()
    .messages({
      'any.only': ERROR_MESSAGES.INVALID_ROLE,
      'any.required': 'Role is required',
    }),
});

// Export validation middlewares
export const validateRegistration = validate(registrationSchema);
export const validateLogin = validate(loginSchema);
export const validateCreateAdmin = validate(createAdminSchema);
export const validateUpdateRole = validate(updateRoleSchema);

/**
 * Custom validation for UUID parameters
 */
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuid)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Invalid ${paramName} format`,
      });
      return;
    }
    
    next();
  };
};

/**
 * Sanitize request body to prevent XSS
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  req.body = sanitize(req.body);
  next();
};