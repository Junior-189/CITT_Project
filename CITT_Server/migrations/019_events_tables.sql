-- Phase 3 Migration: Create events related tables
BEGIN;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  category VARCHAR(50),
  description TEXT,
  start_date DATE,
  end_date DATE,
  location VARCHAR(255),
  published BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event submissions table
CREATE TABLE IF NOT EXISTS event_submissions (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  team_name VARCHAR(255),
  members TEXT,
  description TEXT NOT NULL,
  problem_statement TEXT,
  solution TEXT,
  pitch_url TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Submission feedback table
CREATE TABLE IF NOT EXISTS submission_feedback (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES event_submissions(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_submissions_event ON event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_feedback_submission ON submission_feedback(submission_id);

COMMIT;
