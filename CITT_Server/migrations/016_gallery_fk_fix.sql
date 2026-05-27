-- Fix gallery_images foreign key to use ON DELETE SET NULL
ALTER TABLE gallery_images DROP CONSTRAINT IF EXISTS gallery_images_uploaded_by_fkey;
ALTER TABLE gallery_images ADD CONSTRAINT gallery_images_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
