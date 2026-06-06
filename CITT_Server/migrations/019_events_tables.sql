-- Migration 019: Add missing events columns and indexes (superset of 002)
-- Does NOT redefine tables already created by migration 002.
-- All operations are idempotent (IF NOT EXISTS / DROP IF EXISTS).

-- Add columns that migration 002 may not have added yet
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ensure the check_event_type constraint includes all event types (idempotent)
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_event_type;
ALTER TABLE events ADD CONSTRAINT check_event_type
  CHECK (type IN ('hackathon','workshop','challenge','exhibition','seminar','conference'));

-- Ensure event_submissions has the idempotent status constraint
ALTER TABLE event_submissions DROP CONSTRAINT IF EXISTS check_submission_status;
ALTER TABLE event_submissions ADD CONSTRAINT check_submission_status
  CHECK (status IN ('submitted','under_review','reviewed','finalist','winner','rejected'));

-- Ensure submission_feedback exists (in case 002 didn't create it)
CREATE TABLE IF NOT EXISTS submission_feedback (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES event_submissions(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add reviewer_id column to submission_feedback if it doesn't exist (from 002 schema)
ALTER TABLE submission_feedback ADD COLUMN IF NOT EXISTS reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE submission_feedback ADD COLUMN IF NOT EXISTS message TEXT;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_submissions_event ON event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_feedback_submission ON submission_feedback(submission_id);
