-- Migration 023: Full IP Management tables and columns for PostgreSQL migration
-- Replaces Firestore-based IP management with PostgreSQL

-- Add columns the frontend uses that are missing from ip_management
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

-- IP supporting documents (multiple files per IP)
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

-- IP status history (for tracking the lifecycle, replaces Firestore ipNotifications)
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

-- IP licenses (commercialization)
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
