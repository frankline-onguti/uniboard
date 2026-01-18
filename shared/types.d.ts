export type UserRole = 'student' | 'admin' | 'super_admin';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    studentId?: string | undefined;
    createdAt: string;
    updatedAt: string;
}
export interface Notice {
    id: string;
    title: string;
    content: string;
    category: string;
    createdBy: string;
    expiresAt?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    author?: Pick<User, 'firstName' | 'lastName' | 'email'>;
}
export interface Application {
    id: string;
    noticeId: string;
    studentId: string;
    status: ApplicationStatus;
    applicationData?: Record<string, any>;
    adminNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
    notice?: Pick<Notice, 'title' | 'category'>;
    student?: Pick<User, 'firstName' | 'lastName' | 'email' | 'studentId'>;
    reviewer?: Pick<User, 'firstName' | 'lastName' | 'email'>;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    studentId: string;
}
export interface AuthResponse {
    user: User;
    accessToken: string;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface CreateNoticeRequest {
    title: string;
    content: string;
    category: string;
    expiresAt?: string;
}
export interface UpdateNoticeRequest extends Partial<CreateNoticeRequest> {
    isActive?: boolean;
}
export interface CreateApplicationRequest {
    noticeId: string;
    applicationData?: Record<string, any>;
}
export interface UpdateApplicationRequest {
    status: ApplicationStatus;
    adminNotes?: string;
}
export interface CreateAdminRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface UpdateUserRoleRequest {
    role: UserRole;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface NoticeQueryParams {
    page?: number;
    limit?: number;
    category?: string;
    active?: boolean;
    search?: string;
}
export interface ApplicationQueryParams {
    page?: number;
    limit?: number;
    status?: ApplicationStatus;
    noticeId?: string;
    studentId?: string;
}
export interface UserQueryParams {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
}
export declare const PERMISSIONS: {
    readonly CREATE_NOTICE: readonly ["admin", "super_admin"];
    readonly MANAGE_APPLICATIONS: readonly ["admin", "super_admin"];
    readonly MANAGE_USERS: readonly ["super_admin"];
    readonly CREATE_ADMIN: readonly ["super_admin"];
    readonly VIEW_ALL_APPLICATIONS: readonly ["admin", "super_admin"];
};
export type Permission = keyof typeof PERMISSIONS;
export type RolePermissions = {
    [K in Permission]: UserRole[];
};
export declare const USER_ROLES: UserRole[];
export declare const APPLICATION_STATUSES: ApplicationStatus[];
export declare const EMAIL_REGEX: RegExp;
export declare const PASSWORD_MIN_LENGTH = 8;
export declare const STUDENT_ID_REGEX: RegExp;
//# sourceMappingURL=types.d.ts.map