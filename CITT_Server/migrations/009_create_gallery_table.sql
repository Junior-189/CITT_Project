-- Migration: Create gallery_images table for event photo gallery
-- Admins can upload photos from various events; all users can view them

CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
  event_name VARCHAR(255),
  uploaded_by INTEGER,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_images_deleted_at ON gallery_images(deleted_at);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);
