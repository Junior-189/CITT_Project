-- ============================================
-- CITT RBAC System - SAFE Database Migration
-- Purpose: Add Role-Based Access Control (handles existing data safely)
-- Date: 2025-11-23
-- ============================================

-- ============================================
-- PHASE 1: ADD ROLE COLUMN TO USERS TABLE
-- ============================================

-- 1. Add role column with default value 'innovator'
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'innovator';

-- 2. Create index for faster role queries (before constraint)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. IMPORTANT: Fix any NULL or invalid role values FIRST
--    This prevents the constraint violation error
UPDATE users
SET role = 'innovator'
WHERE role IS NULL
   OR role NOT IN ('superAdmin', 'admin', 'ipManager', 'innovator');

-- Show how many users were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM users WHERE role = 'innovator';
  RAISE NOTICE 'Updated/Set % users to innovator role', updated_count;
END $$;

-- 4. NOW add role constraint (safe because we cleaned the data)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS check_role;

ALTER TABLE users
  ADD CONSTRAINT check_role
  CHECK (role IN ('superAdmin', 'admin', 'ipManager', 'innovator'));

COMMENT ON COLUMN users.role IS 'User role: superAdmin, admin, ipManager, or innovator';

-- ============================================
-- PHASE 2: CREATE AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs (for faster queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

COMMENT ON TABLE audit_logs IS 'Activity log for tracking all system actions';

-- ============================================
-- PHASE 3: CREATE ROLE PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

COMMENT ON TABLE role_permissions IS 'Permission matrix for role-based access control';

-- ============================================
-- PHASE 4: SEED DEFAULT PERMISSIONS
-- ============================================

-- Clear existing permissions (if re-running migration)
TRUNCATE TABLE role_permissions CASCADE;

-- SUPER ADMIN PERMISSIONS (Full Access)
INSERT INTO role_permissions (role, resource, action, description) VALUES
('superAdmin', '*', '*', 'Full system access to all resources'),
('superAdmin', 'users', 'promote', 'Promote users to different roles'),
('superAdmin', 'users', 'demote', 'Demote users from their roles'),
('superAdmin', 'users', 'delete', 'Delete user accounts'),
('superAdmin', 'system', 'settings', 'Manage system-wide settings'),
('superAdmin', 'audit', 'view', 'View all audit logs'),
('superAdmin', 'roles', 'manage', 'Manage role permissions');

-- ADMIN PERMISSIONS
INSERT INTO role_permissions (role, resource, action, description) VALUES
('admin', 'users', 'read', 'View all users'),
('admin', 'users', 'update', 'Update user information'),
('admin', 'projects', 'read', 'View all projects'),
('admin', 'projects', 'approve', 'Approve project submissions'),
('admin', 'projects', 'reject', 'Reject project submissions'),
('admin', 'projects', 'delete', 'Delete projects'),
('admin', 'funding', 'read', 'View all funding applications'),
('admin', 'funding', 'approve', 'Approve funding applications'),
('admin', 'funding', 'reject', 'Reject funding applications'),
('admin', 'funding', 'delete', 'Delete funding applications'),
('admin', 'events', 'create', 'Create new events'),
('admin', 'events', 'read', 'View all events'),
('admin', 'events', 'update', 'Update event details'),
('admin', 'events', 'delete', 'Delete events'),
('admin', 'ip_management', 'read', 'View all IP records'),
('admin', 'analytics', 'view', 'View system analytics and charts'),
('admin', 'reports', 'generate', 'Generate system reports'),
('admin', 'audit', 'view', 'View audit logs');

-- IP MANAGER PERMISSIONS
INSERT INTO role_permissions (role, resource, action, description) VALUES
('ipManager', 'ip_management', 'read', 'View all IP records'),
('ipManager', 'ip_management', 'create', 'Create IP records'),
('ipManager', 'ip_management', 'update', 'Update IP records'),
('ipManager', 'ip_management', 'approve', 'Approve IP applications'),
('ipManager', 'ip_management', 'reject', 'Reject IP applications'),
('ipManager', 'ip_management', 'delete', 'Delete IP records'),
('ipManager', 'projects', 'read', 'View projects related to IP'),
('ipManager', 'analytics', 'view', 'View IP-related analytics'),
('ipManager', 'reports', 'generate', 'Generate IP reports');

-- INNOVATOR PERMISSIONS (Regular Users)
INSERT INTO role_permissions (role, resource, action, description) VALUES
('innovator', 'projects', 'create', 'Create own projects'),
('innovator', 'projects', 'read_own', 'View own projects'),
('innovator', 'projects', 'update_own', 'Update own projects'),
('innovator', 'projects', 'delete_own', 'Delete own projects'),
('innovator', 'funding', 'create', 'Apply for funding'),
('innovator', 'funding', 'read_own', 'View own funding applications'),
('innovator', 'funding', 'update_own', 'Update own funding applications'),
('innovator', 'funding', 'delete_own', 'Delete own funding applications'),
('innovator', 'ip_management', 'create', 'Submit IP applications'),
('innovator', 'ip_management', 'read_own', 'View own IP records'),
('innovator', 'ip_management', 'update_own', 'Update own IP records'),
('innovator', 'events', 'read', 'View all events'),
('innovator', 'profile', 'update_own', 'Update own profile');

-- ============================================
-- PHASE 5: UPDATE PROJECTS TABLE
-- ============================================

-- Add approval status and tracking columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add project status tracking
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_status VARCHAR(50) DEFAULT 'submitted';

-- Clean any invalid values before adding constraints
UPDATE projects
SET approval_status = 'pending'
WHERE approval_status IS NULL
   OR approval_status NOT IN ('pending', 'approved', 'rejected');

UPDATE projects
SET project_status = 'submitted'
WHERE project_status IS NULL
   OR project_status NOT IN ('submitted', 'on_progress', 'completed');

-- Add constraint for approval_status
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS check_approval_status;

ALTER TABLE projects
  ADD CONSTRAINT check_approval_status
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add constraint for project_status
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS check_project_status;

ALTER TABLE projects
  ADD CONSTRAINT check_project_status
  CHECK (project_status IN ('submitted', 'on_progress', 'completed'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

COMMENT ON COLUMN projects.approval_status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN projects.project_status IS 'Project progress: submitted, on_progress, completed';

-- ============================================
-- PHASE 6: UPDATE FUNDING TABLE
-- ============================================

-- Add approval status and tracking columns
ALTER TABLE funding
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE funding
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE funding
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE funding
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add funding status tracking
ALTER TABLE funding
  ADD COLUMN IF NOT EXISTS funding_status VARCHAR(50) DEFAULT 'applied';

-- Clean any invalid values before adding constraints
UPDATE funding
SET approval_status = 'pending'
WHERE approval_status IS NULL
   OR approval_status NOT IN ('pending', 'approved', 'rejected');

UPDATE funding
SET funding_status = 'applied'
WHERE funding_status IS NULL
   OR funding_status NOT IN ('applied', 'on_progress', 'approved', 'disbursed', 'completed');

-- Add constraint for approval_status
ALTER TABLE funding
  DROP CONSTRAINT IF EXISTS check_funding_approval_status;

ALTER TABLE funding
  ADD CONSTRAINT check_funding_approval_status
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add constraint for funding_status
ALTER TABLE funding
  DROP CONSTRAINT IF EXISTS check_funding_status;

ALTER TABLE funding
  ADD CONSTRAINT check_funding_status
  CHECK (funding_status IN ('applied', 'on_progress', 'approved', 'disbursed', 'completed'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_funding_approval_status ON funding(approval_status);
CREATE INDEX IF NOT EXISTS idx_funding_funding_status ON funding(funding_status);
CREATE INDEX IF NOT EXISTS idx_funding_user_id ON funding(user_id);

COMMENT ON COLUMN funding.approval_status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN funding.funding_status IS 'Funding progress: applied, on_progress, approved, disbursed, completed';

-- ============================================
-- PHASE 7: UPDATE IP_MANAGEMENT TABLE
-- ============================================

-- Add approval status and tracking columns
ALTER TABLE ip_management
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE ip_management
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE ip_management
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE ip_management
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Clean any invalid values before adding constraint
UPDATE ip_management
SET approval_status = 'pending'
WHERE approval_status IS NULL
   OR approval_status NOT IN ('pending', 'approved', 'rejected');

-- Add constraint for approval_status
ALTER TABLE ip_management
  DROP CONSTRAINT IF EXISTS check_ip_approval_status;

ALTER TABLE ip_management
  ADD CONSTRAINT check_ip_approval_status
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ip_management_approval_status ON ip_management(approval_status);
CREATE INDEX IF NOT EXISTS idx_ip_management_user_id ON ip_management(user_id);

COMMENT ON COLUMN ip_management.approval_status IS 'Approval status: pending, approved, rejected';

-- ============================================
-- PHASE 8: UPDATE EVENTS TABLE
-- ============================================

-- Add created_by and updated_by tracking
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

COMMENT ON COLUMN events.created_by IS 'User who created the event (typically admin or superAdmin)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View current table structure
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'projects', 'funding', 'ip_management', 'events', 'audit_logs', 'role_permissions')
ORDER BY table_name, ordinal_position;

-- Count users by role
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY
  CASE role
    WHEN 'superAdmin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'ipManager' THEN 3
    WHEN 'innovator' THEN 4
  END;

-- View all permissions by role
SELECT role, COUNT(*) as permission_count
FROM role_permissions
GROUP BY role
ORDER BY
  CASE role
    WHEN 'superAdmin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'ipManager' THEN 3
    WHEN 'innovator' THEN 4
  END;

-- Check if all required tables exist
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✓ users'
    ELSE '✗ users MISSING'
  END as users_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN '✓ audit_logs'
    ELSE '✗ audit_logs MISSING'
  END as audit_logs_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN '✓ role_permissions'
    ELSE '✗ role_permissions MISSING'
  END as role_permissions_table;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ CITT RBAC Migration Completed Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run createTestAccounts.js to create test users';
  RAISE NOTICE '2. Verify roles with: SELECT * FROM users;';
  RAISE NOTICE '3. Check permissions: SELECT * FROM role_permissions;';
  RAISE NOTICE '============================================';
END $$;
