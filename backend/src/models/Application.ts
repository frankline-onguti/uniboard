import { ApplicationStatus, User } from '../../../shared/types';
import { NoticeModel } from './Notice';

export interface ApplicationModel {
  id: string;
  noticeId: string;
  studentId: string;
  status: ApplicationStatus;
  applicationData?: Record<string, any>;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationData {
  noticeId: string;
  studentId: string;
  applicationData?: Record<string, any>;
}

export interface UpdateApplicationData {
  status?: ApplicationStatus;
  adminNotes?: string;
  reviewedBy?: string;
}

export interface ApplicationWithRelations extends ApplicationModel {
  notice: Pick<NoticeModel, 'title' | 'category' | 'expiresAt'>;
  student: Pick<User, 'firstName' | 'lastName' | 'email' | 'studentId'>;
  reviewer?: Pick<User, 'firstName' | 'lastName' | 'email'>;
}

// Application status constants
export const APPLICATION_STATUSES: ApplicationStatus[] = ['pending', 'approved', 'rejected'];

// Validation helpers
export const isValidStatus = (status: string): status is ApplicationStatus => {
  return APPLICATION_STATUSES.includes(status as ApplicationStatus);
};

export const canUpdateApplication = (application: ApplicationModel): boolean => {
  // Can only update pending applications
  return application.status === 'pending';
};

export const canStudentApply = (notice: NoticeModel): boolean => {
  // Check if notice is active and not expired
  if (!notice.isActive) return false;
  if (notice.expiresAt && new Date() > notice.expiresAt) return false;
  return true;
};

// Query filters
export interface ApplicationFilters {
  status?: ApplicationStatus;
  noticeId?: string;
  studentId?: string;
  reviewedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface ApplicationQueryResult {
  applications: ApplicationModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Application statistics
export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byNotice: Record<string, {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

// Business logic helpers
export const getApplicationStatusColor = (status: ApplicationStatus): string => {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
};

export const getApplicationStatusText = (status: ApplicationStatus): string => {
  switch (status) {
    case 'pending':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Not Selected';
    default:
      return 'Unknown';
  }
};

export const canReviewApplication = (userRole: string): boolean => {
  return userRole === 'admin' || userRole === 'super_admin';
};