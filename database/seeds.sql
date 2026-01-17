-- UniBoard Database Seeds
-- Initial data for development and testing

-- Insert default super admin
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@university.edu', '$2b$12$LQv3c1yqBw2LeOI.S8.Reu4.bDDtxp2f0P2jDUWQR90.iaKInjIu2', 'super_admin', 'System', 'Administrator');

-- Insert sample admin user
-- Password: Admin123!
INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.admin@university.edu', '$2b$12$LQv3c1yqBw2LeOI.S8.Reu4.bDDtxp2f0P2jDUWQR90.iaKInjIu2', 'admin', 'John', 'Smith');

-- Insert sample students
-- Password: Student123!
INSERT INTO users (id, email, password_hash, role, first_name, last_name, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'alice.student@university.edu', '$2b$12$8HqnzQk7fY2vM9xJ3nK8/.QGJ5H5H5H5H5H5H5H5H5H5H5H5H5H5H5', 'student', 'Alice', 'Johnson', 'STU001234'),
('550e8400-e29b-41d4-a716-446655440003', 'bob.student@university.edu', '$2b$12$8HqnzQk7fY2vM9xJ3nK8/.QGJ5H5H5H5H5H5H5H5H5H5H5H5H5H5H5', 'student', 'Bob', 'Wilson', 'STU001235'),
('550e8400-e29b-41d4-a716-446655440004', 'carol.student@university.edu', '$2b$12$8HqnzQk7fY2vM9xJ3nK8/.QGJ5H5H5H5H5H5H5H5H5H5H5H5H5H5H5', 'student', 'Carol', 'Davis', 'STU001236');

-- Insert sample notices
INSERT INTO notices (id, title, content, category, created_by, expires_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Scholarship Application Open', 'The Merit-Based Scholarship for Academic Excellence is now accepting applications. Eligible students must have a GPA of 3.5 or higher and demonstrate financial need. Application deadline is March 15, 2026.', 'scholarship', '550e8400-e29b-41d4-a716-446655440001', '2026-03-15 23:59:59'),
('660e8400-e29b-41d4-a716-446655440001', 'Research Assistant Positions', 'The Computer Science Department is hiring undergraduate research assistants for the Spring 2026 semester. Positions available in AI, cybersecurity, and software engineering labs. Minimum 3.0 GPA required.', 'job', '550e8400-e29b-41d4-a716-446655440001', '2026-02-28 23:59:59'),
('660e8400-e29b-41d4-a716-446655440002', 'Study Abroad Information Session', 'Join us for an information session about study abroad opportunities for Fall 2026. Learn about programs in Europe, Asia, and Australia. Financial aid and scholarships available.', 'event', '550e8400-e29b-41d4-a716-446655440001', '2026-02-20 18:00:00'),
('660e8400-e29b-41d4-a716-446655440003', 'Career Fair Registration', 'The Annual Career Fair will be held on March 10, 2026. Over 100 companies will be participating. Register now to secure your spot and upload your resume to the career portal.', 'career', '550e8400-e29b-41d4-a716-446655440001', '2026-03-08 23:59:59'),
('660e8400-e29b-41d4-a716-446655440004', 'Library Extended Hours', 'During finals week (March 20-27), the library will be open 24/7. Additional study spaces and computer labs will be available. Quiet zones strictly enforced.', 'announcement', '550e8400-e29b-41d4-a716-446655440001', '2026-03-27 23:59:59');

-- Insert sample applications
INSERT INTO applications (id, notice_id, student_id, status, application_data, admin_notes) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'pending', '{"gpa": 3.8, "essay": "I am passionate about computer science and have maintained excellent grades...", "financialNeed": true}', NULL),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'approved', '{"gpa": 3.8, "preferredLab": "AI", "experience": "Completed CS301 and CS401 with A grades"}', 'Excellent academic record and strong interest in AI research.'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'pending', '{"gpa": 3.2, "preferredLab": "cybersecurity", "experience": "Self-taught ethical hacking, completed online courses"}', NULL),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'approved', '{"preferredCountry": "Germany", "language": "German (intermediate)", "major": "Computer Science"}', 'Good fit for our German exchange program.'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'rejected', '{"gpa": 2.9, "essay": "I need financial assistance for my studies...", "financialNeed": true}', 'GPA below minimum requirement of 3.5.');

-- Update applications with reviewer information
UPDATE applications 
SET reviewed_by = '550e8400-e29b-41d4-a716-446655440001', 
    reviewed_at = CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE status IN ('approved', 'rejected');

-- Note: In production, use proper password hashing
-- The passwords above are hashed versions of:
-- Super Admin: Admin123!
-- Admin: Admin123!  
-- Students: Student123!