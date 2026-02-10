-- Migration 010: Fix ip_management table columns
-- The table was created with ip_address (network IP) but the system manages
-- Intellectual Property records. Add proper IP (Intellectual Property) columns.

-- Add missing columns for proper IP management
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS ip_type VARCHAR(100);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS inventors TEXT;
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS field VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS abstract TEXT;
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS trl VARCHAR(50);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS patent_number VARCHAR(255);
ALTER TABLE ip_management ADD COLUMN IF NOT EXISTS prior_art TEXT;

-- Make ip_address nullable (was incorrectly required as network IP)
ALTER TABLE ip_management ALTER COLUMN ip_address DROP NOT NULL;
ALTER TABLE ip_management ALTER COLUMN ip_address SET DEFAULT NULL;

-- Drop the UNIQUE constraint on ip_address (not relevant for IP records)
ALTER TABLE ip_management DROP CONSTRAINT IF EXISTS ip_management_ip_address_key;

-- Copy ip_title to title where title is null (preserve existing data)
UPDATE ip_management SET title = ip_title WHERE title IS NULL AND ip_title IS NOT NULL;

-- Create index on ip_type for filtering
CREATE INDEX IF NOT EXISTS idx_ip_management_ip_type ON ip_management(ip_type);
