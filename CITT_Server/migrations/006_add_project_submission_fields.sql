-- Migration: Add additional fields used by project submission UI
-- Purpose: Persist funding_needed and problem_statement from the frontend

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS funding_needed BIGINT DEFAULT 0;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS problem_statement TEXT;

-- Optional index (useful for reporting/filtering)
CREATE INDEX IF NOT EXISTS idx_projects_funding_needed ON projects(funding_needed);

