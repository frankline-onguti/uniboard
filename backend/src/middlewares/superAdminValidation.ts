import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { HTTP_STATUS } from '../utils/constants';

/**
 * Admin creation validation schema
 */
const createAdminSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
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
 * Role change validation schema
 */
const roleChangeSchema = Joi.object({
  role: Joi.string()
    .valid('student', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be either student or admin',
      'any.required': 'Role is required',
    }),
});

/**
 * Validate admin creation request
 */
export const validateCreateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = createAdminSchema.validate(req.body);
  
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
 * Validate role change request
 */
export const validateRoleChange = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = roleChangeSchema.validate(req.body);
  
  if (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: error.details[0].message,
    });
    return;
  }
  
  next();
};