-- Migration: Add performance indexes for core queries
-- Created: 2024-01-17T00:00:04.000Z

-- Additional composite indexes for common query patterns

-- User queries
CREATE INDEX idx_users_role_active ON users(role, is_active) WHERE is_active = true;
CREATE INDEX idx_users_email_active ON users(email, is_active) WHERE is_active = true;

-- Notice queries - most common patterns
CREATE INDEX idx_notices_active_category_created ON notices(is_active, category, created_at DESC) 
    WHERE is_active = true;
CREATE INDEX idx_notices_active_priority_created ON notices(is_active, priority DESC, created_at DESC) 
    WHERE is_active = true;
CREATE INDEX idx_notices_expires_active ON notices(expires_at, is_active) 
    WHERE expires_at IS NOT NULL AND is_active = true;

-- Application queries - admin dashboard patterns
CREATE INDEX idx_applications_status_created ON applications(status, created_at DESC);
CREATE INDEX idx_applications_notice_created ON applications(notice_id, created_at DESC);
CREATE INDEX idx_applications_pending_created ON applications(created_at DESC) 
    WHERE status = 'pending';

-- Cross-table query optimization
CREATE INDEX idx_applications_student_notice_status ON applications(student_id, notice_id, status);

-- Partial indexes for specific use cases
CREATE INDEX idx_notices_recent_active ON notices(created_at DESC) 
    WHERE is_active = true AND created_at > (CURRENT_TIMESTAMP - INTERVAL '30 days');

CREATE INDEX idx_applications_recent_pending ON applications(created_at DESC) 
    WHERE status = 'pending' AND created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days');

-- Statistics update for query planner
ANALYZE users;
ANALYZE notices;
ANALYZE applications;
ANALYZE refresh_tokens;