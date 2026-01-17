import { User } from '../../../shared/types';

export interface NoticeModel {
  id: string;
  title: string;
  content: string;
  category: string;
  createdBy: string;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoticeData {
  title: string;
  content: string;
  category: string;
  createdBy: string;
  expiresAt?: Date;
}

export interface UpdateNoticeData {
  title?: string;
  content?: string;
  category?: string;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface NoticeWithAuthor extends NoticeModel {
  author: Pick<User, 'firstName' | 'lastName' | 'email'>;
}

// Notice categories
export const NOTICE_CATEGORIES = [
  'scholarship',
  'job',
  'internship',
  'event',
  'career',
  'announcement',
  'academic',
  'housing',
  'financial_aid',
  'research'
] as const;

export type NoticeCategory = typeof NOTICE_CATEGORIES[number];

// Validation helpers
export const isValidCategory = (category: string): category is NoticeCategory => {
  return NOTICE_CATEGORIES.includes(category as NoticeCategory);
};

export const isNoticeExpired = (notice: NoticeModel): boolean => {
  if (!notice.expiresAt) return false;
  return new Date() > notice.expiresAt;
};

export const isNoticeActive = (notice: NoticeModel): boolean => {
  return notice.isActive && !isNoticeExpired(notice);
};

// Query filters
export interface NoticeFilters {
  category?: NoticeCategory;
  isActive?: boolean;
  createdBy?: string;
  search?: string;
  includeExpired?: boolean;
}

export interface NoticePagination {
  page: number;
  limit: number;
  offset: number;
}

export interface NoticeQueryResult {
  notices: NoticeModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}