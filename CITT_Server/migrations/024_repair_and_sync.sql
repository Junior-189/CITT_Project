-- Migration 024: Repair and sync — idempotent safety net
-- Ensures any partially-migrated database reaches the full expected schema.
-- All operations are guarded (IF NOT EXISTS / DROP IF EXISTS / ADD COLUMN IF NOT EXISTS).

-- ============================================
-- USERS: ensure account_status, campus, profile_photo_url, approval columns
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by_admin INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_rejection_reason TEXT;

-- Auto-approve existing users: set approved for those with NULL or 'pending' account_status
UPDATE users SET account_status = 'approved'
WHERE account_status IS NULL OR account_status = 'pending';

-- Ensure users role constraint allows all 11 CITT roles (idempotent)
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('superAdmin','admin','transferTechnologyOfficer','ipManager',
    'diiDirector','debmDirector','rtpDirector','mentor','technicalCommittee','coordinator','innovator'));

-- ============================================
-- REFRESH TOKENS, PASSWORD RESET, TOKEN BLACKLIST
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  family TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);

-- ============================================
-- NOTIFICATIONS: ensure link column exists
-- ============================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500);

-- ============================================
-- EVENTS: ensure deleted_at and category exist
-- ============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- ============================================
-- IP MANAGEMENT: all columns from migration 023
-- ============================================
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS milestone_stage VARCHAR(50);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS application_number VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS trademark_reg_number VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS trademark_classification VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS copyright_reg_number VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS copyright_type VARCHAR(100);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS design_reg_number VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS design_classification VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS firestore_id VARCHAR(255);

-- IP supporting documents
CREATE TABLE IF NOT EXISTS ip_documents (
  id          SERIAL PRIMARY KEY,
  ip_id       INTEGER NOT NULL REFERENCES ip_management(id) ON DELETE CASCADE,
  file_name   VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  file_size   INTEGER,
  mime_type   VARCHAR(100),
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ip_documents_ip_id ON ip_documents(ip_id);

-- IP status history
CREATE TABLE IF NOT EXISTS ip_status_history (
  id          SERIAL PRIMARY KEY,
  ip_id       INTEGER NOT NULL REFERENCES ip_management(id) ON DELETE CASCADE,
  old_status  VARCHAR(50),
  new_status  VARCHAR(50) NOT NULL,
  changed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ip_status_history_ip_id ON ip_status_history(ip_id);

-- IP licenses
CREATE TABLE IF NOT EXISTS ip_licenses (
  id            SERIAL PRIMARY KEY,
  ip_id         INTEGER NOT NULL REFERENCES ip_management(id) ON DELETE CASCADE,
  licensee      VARCHAR(255) NOT NULL,
  royalty_rate  NUMERIC(5,2),
  terms         TEXT,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ip_licenses_ip_id ON ip_licenses(ip_id);

-- IP royalty payments
CREATE TABLE IF NOT EXISTS ip_royalties (
  id          SERIAL PRIMARY KEY,
  license_id  INTEGER NOT NULL REFERENCES ip_licenses(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  note        TEXT,
  recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ip_royalties_license_id ON ip_royalties(license_id);

CREATE INDEX IF NOT EXISTS idx_ip_management_status ON ip_management(status);
