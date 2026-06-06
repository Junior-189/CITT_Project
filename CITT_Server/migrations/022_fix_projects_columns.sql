-- Phase 6: Add missing columns to projects table
BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_status VARCHAR(50) DEFAULT 'submitted';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS institution VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_needed DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add index for soft-delete lookups
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

COMMIT;
