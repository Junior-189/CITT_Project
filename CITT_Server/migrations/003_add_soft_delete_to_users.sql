-- Migration: Add soft delete columns to users table
-- This allows us to mark users as deleted without permanently removing them
-- Deleted users can be restored or permanently deleted later

-- Add deleted_at column (timestamp when user was deleted)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add deleted_by column (user ID of who deleted this user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Add foreign key constraint for deleted_by
ALTER TABLE users ADD CONSTRAINT fk_deleted_by
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for faster queries on deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Add comment explaining the soft delete pattern
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft-deleted. NULL means user is active.';
COMMENT ON COLUMN users.deleted_by IS 'User ID of admin/superadmin who deleted this user.';
