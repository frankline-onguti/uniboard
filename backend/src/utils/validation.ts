import { HTTP_STATUS } from './constants';

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Ensures a required parameter is present and returns it as a string
 * Throws BadRequestError if the parameter is undefined or empty
 */
export function requireParam(value: string | undefined, name: string): string {
  if (!value) {
    throw new BadRequestError(`${name} is required`);
  }
  return value;
}

/**
 * Safely builds filter objects with conditional properties
 */
export function buildFilters<T extends Record<string, any>>(
  filters: Partial<T>
): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key as keyof T] = value;
    }
  }
  
  return result;
}