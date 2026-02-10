-- Migration: Create notifications table for user notifications
-- This table stores notifications for users about events, approvals, and system updates

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500), -- Optional link to related resource
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comment
COMMENT ON TABLE notifications IS 'User notifications for events, approvals, and system updates';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';
