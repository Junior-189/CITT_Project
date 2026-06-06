-- Migration 025: Post-015 repair — idempotent safety net for anything 024 missed
-- Covers audit_logs, submission_feedback columns, notification indexes, events, users indexes

-- audit_logs table (015 created it; 024 did not; ensure it exists)
CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  resource     VARCHAR(100),
  resource_id  INTEGER,
  details      JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- submission_feedback: add reviewer_id and message (019 was skipped, these were never added)
ALTER TABLE submission_feedback ADD COLUMN IF NOT EXISTS reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE submission_feedback ADD COLUMN IF NOT EXISTS message TEXT;
-- backfill admin_id from reviewer_id if reviewer_id exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submission_feedback' AND column_name='reviewer_id') THEN
    UPDATE submission_feedback SET admin_id = reviewer_id WHERE admin_id IS NULL AND reviewer_id IS NOT NULL;
  END IF;
END $$;

-- notifications performance indexes (015 added these; confirm present)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- events category/deleted_at safety
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100);
UPDATE events SET category = type WHERE category IS NULL AND type IS NOT NULL;

-- users campus + account_status indexes
CREATE INDEX IF NOT EXISTS idx_users_campus ON users(campus);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
