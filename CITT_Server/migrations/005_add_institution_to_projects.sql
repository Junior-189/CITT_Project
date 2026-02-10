-- Migration: Add institution column to projects table
-- Purpose: Add institution/organization field used by frontend project submissions

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS institution VARCHAR(255);

-- Add index for institution searches
CREATE INDEX IF NOT EXISTS idx_projects_institution ON projects(institution);

-- Optional: backfill institution from existing Firestore export or other sources
-- Use a manual migration script to populate the column if needed.
