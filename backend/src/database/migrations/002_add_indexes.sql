-- Migration: 002_add_indexes
-- Description: Add performance indexes for core queries
-- Created: 2026-01-17

-- Performance indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;

-- Performance indexes for notices table
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX idx_notices_active ON notices(is_active) WHERE is_active = true;
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_expires_at ON notices(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notices_created_by ON notices(created_by);

-- Performance indexes for applications table
CREATE INDEX idx_applications_notice_student ON applications(notice_id, student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_notice_id ON applications(notice_id);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Performance indexes for refresh_tokens table
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Composite indexes for common queries
CREATE INDEX idx_notices_active_category ON notices(is_active, category) WHERE is_active = true;
CREATE INDEX idx_applications_student_status ON applications(student_id, status);
CREATE INDEX idx_applications_notice_status ON applications(notice_id, status);