/**
 * Gallery Routes
 * Purpose: Public gallery viewing + admin image upload/management
 * Access: GET is public, POST/DELETE are admin/superAdmin only
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
const { asyncHandler } = require('../middleware/errorHandler');

// Configure multer for gallery image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'gallery');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * GET /api/gallery
 * Get all gallery images (public - no auth required)
 */
router.get('/', asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT gi.*, u.name as uploaded_by_name
    FROM gallery_images gi
    LEFT JOIN users u ON gi.uploaded_by = u.id
    WHERE gi.deleted_at IS NULL
    ORDER BY gi.created_at DESC
  `);

  res.json({ images: result.rows });
}));

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * POST /api/gallery
 * Upload a new gallery image
 * Access: admin, superAdmin
 */
router.post('/',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { title, description, event_name } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const imageUrl = `/uploads/gallery/${req.file.filename}`;

    const result = await pool.query(`
      INSERT INTO gallery_images (title, description, image_url, event_name, uploaded_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [title, description || null, imageUrl, event_name || null, req.user.id]);

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: result.rows[0]
    });
  })
);

/**
 * DELETE /api/gallery/:id
 * Soft-delete a gallery image
 * Access: admin, superAdmin
 */
router.delete('/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE gallery_images
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, title
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      message: 'Image deleted successfully',
      imageTitle: result.rows[0].title
    });
  })
);

module.exports = router;
