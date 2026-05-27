-- Migration 015: Critical fixes and schema enhancements

-- 1. Fix the duplicate role constraint bug (Critical Bug #9)
-- The old 'check_role' constraint only allows 4 roles, blocking all other role inserts
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'superAdmin','admin','transferTechnologyOfficer','ipManager',
    'diiDirector','debmDirector','rtpDirector',
    'mentor','technicalCommittee','coordinator','innovator'
  )
);

-- 2. Add account_status column for Admin Approval feature
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  account_status VARCHAR(20) DEFAULT 'pending'
  CHECK (account_status IN ('pending','approved','rejected'));

-- 3. Auto-approve all EXISTING users so current accounts are not locked out
UPDATE users SET account_status = 'approved' WHERE account_status IS NULL OR account_status = 'pending';

-- 4. Add rejection_reason column
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_rejection_reason TEXT;

-- 5. Add approved_by and approved_at columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by_admin INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- 6. Add profile_photo_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);

-- 7. Add campus column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus VARCHAR(50) CHECK (campus IN ('Main Campus','Rukwa Campus'));

-- 8. Create audit_logs table (was missing entirely — Critical Bug #4)
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

-- 9. Add deleted_at and category to events table (Critical Bugs #6 and #7)
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100);
UPDATE events SET category = type WHERE category IS NULL AND type IS NOT NULL;

-- 10. Fix submission_feedback table column name (Critical Bug #8)
ALTER TABLE submission_feedback ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
UPDATE submission_feedback SET admin_id = reviewer_id WHERE admin_id IS NULL AND reviewer_id IS NOT NULL;

-- 11. Add link column to notifications for clickable navigation (Q6 from Session 2)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500);

-- 12. Add index on notifications for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- 13. Add campus to users index
CREATE INDEX IF NOT EXISTS idx_users_campus ON users(campus);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

SELECT 'Migration 015 completed' AS result;
