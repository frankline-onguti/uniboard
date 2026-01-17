-- Migration: Create applications table
-- Created: 2024-01-17T00:00:02.000Z

-- Applications table for student applications to notices
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    application_data JSONB, -- Flexible application form data
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate applications
    UNIQUE(notice_id, student_id)
);

-- Indexes for performance
CREATE INDEX idx_applications_notice_id ON applications(notice_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_reviewed_by ON applications(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_applications_notice_status ON applications(notice_id, status);
CREATE INDEX idx_applications_student_status ON applications(student_id, status);

-- JSONB indexes for application data queries
CREATE INDEX idx_applications_data_gin ON applications USING gin(application_data);

-- Apply updated_at trigger to applications
CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Constraint: Only students can create applications
ALTER TABLE applications ADD CONSTRAINT check_student_applicant
    CHECK (
        student_id IN (
            SELECT id FROM users WHERE role = 'student'
        )
    );

-- Constraint: Only admins can review applications
ALTER TABLE applications ADD CONSTRAINT check_admin_reviewer
    CHECK (
        reviewed_by IS NULL OR 
        reviewed_by IN (
            SELECT id FROM users WHERE role IN ('admin', 'super_admin')
        )
    );