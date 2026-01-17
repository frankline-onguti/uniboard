-- Migration: Create notices table
-- Created: 2024-01-17T00:00:01.000Z

-- Notices table for announcements and opportunities
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    attachment_url VARCHAR(500), -- Optional file attachment
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX idx_notices_active ON notices(is_active) WHERE is_active = true;
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_expires_at ON notices(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notices_priority ON notices(priority DESC);
CREATE INDEX idx_notices_created_by ON notices(created_by);

-- Full-text search index for title and content
CREATE INDEX idx_notices_search ON notices USING gin(to_tsvector('english', title || ' ' || content));

-- Apply updated_at trigger to notices
CREATE TRIGGER update_notices_updated_at 
    BEFORE UPDATE ON notices
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Check constraint for valid categories
ALTER TABLE notices ADD CONSTRAINT check_notice_category 
    CHECK (category IN ('announcement', 'scholarship', 'job', 'event', 'career', 'academic', 'housing', 'other'));