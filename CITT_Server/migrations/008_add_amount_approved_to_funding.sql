-- Add amount_approved column to funding table
-- This stores the specific amount approved by Admin/IP Manager (may differ from requested amount)

ALTER TABLE funding ADD COLUMN IF NOT EXISTS amount_approved DECIMAL(15, 2) DEFAULT NULL;

-- Add index for faster queries on approved funding
CREATE INDEX IF NOT EXISTS idx_funding_amount_approved ON funding(amount_approved);
