// Shared TypeScript types between frontend and backend
// Permission utilities
export const PERMISSIONS = {
    CREATE_NOTICE: ['admin', 'super_admin'],
    MANAGE_APPLICATIONS: ['admin', 'super_admin'],
    MANAGE_USERS: ['super_admin'],
    CREATE_ADMIN: ['super_admin'],
    VIEW_ALL_APPLICATIONS: ['admin', 'super_admin'],
};
// Constants
export const USER_ROLES = ['student', 'admin', 'super_admin'];
export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];
// Validation schemas (for runtime validation)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const STUDENT_ID_REGEX = /^[A-Z0-9]{6,12}$/;
//# sourceMappingURL=types.js.map