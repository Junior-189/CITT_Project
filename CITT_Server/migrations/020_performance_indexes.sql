-- Phase 5 Migration: Performance indexes
BEGIN;

-- Projects: frequently filtered by user_id and approval status
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status);

-- Project milestones: optimize lookups
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);

-- Project assignments: optimize active assignments lookup
CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON project_assignments(assigned_user_id, active);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id, active);

-- Milestone comments: optimize comment lookup
CREATE INDEX IF NOT EXISTS idx_milestone_comments_project ON milestone_comments(project_id);

-- User lookups: optimize role and account status filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

COMMIT;
