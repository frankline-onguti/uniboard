-- UniBoard Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin', 'super_admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE, -- Only for students
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notices table
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    application_data JSONB, -- Flexible application form data
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notice_id, student_id) -- One application per student per notice
);

-- Refresh tokens table (for JWT management)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role change audit log
CREATE TABLE role_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    changed_by UUID NOT NULL REFERENCES users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    old_role VARCHAR(20) NOT NULL,
    new_role VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;

CREATE INDEX idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX idx_notices_active ON notices(is_active) WHERE is_active = true;
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_expires_at ON notices(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_applications_notice_student ON applications(notice_id, student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX idx_role_change_logs_changed_by ON role_change_logs(changed_by);
CREATE INDEX idx_role_change_logs_target_user ON role_change_logs(target_user_id);
CREATE INDEX idx_role_change_logs_changed_at ON role_change_logs(changed_at DESC);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (except admins)
CREATE POLICY users_select_policy ON users
    FOR SELECT USING (
        id = current_setting('app.current_user_id')::UUID OR
        current_setting('app.current_user_role') IN ('admin', 'super_admin')
    );

-- Students can view active notices
CREATE POLICY notices_select_policy ON notices
    FOR SELECT USING (
        is_active = true OR
        current_setting('app.current_user_role') IN ('admin', 'super_admin')
    );

-- Only admins can create/update/delete notices
CREATE POLICY notices_modify_policy ON notices
    FOR ALL USING (
        current_setting('app.current_user_role') IN ('admin', 'super_admin')
    );

-- Students can only see their own applications, admins see all
CREATE POLICY applications_select_policy ON applications
    FOR SELECT USING (
        student_id = current_setting('app.current_user_id')::UUID OR
        current_setting('app.current_user_role') IN ('admin', 'super_admin')
    );

-- Students can create applications, admins can update them
CREATE POLICY applications_insert_policy ON applications
    FOR INSERT WITH CHECK (
        student_id = current_setting('app.current_user_id')::UUID AND
        current_setting('app.current_user_role') = 'student'
    );

CREATE POLICY applications_update_policy ON applications
    FOR UPDATE USING (
        current_setting('app.current_user_role') IN ('admin', 'super_admin')
    );

-- Cleanup expired refresh tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to cleanup expired tokens (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');