/**
 * CMS Routes
 * Purpose: Content management for pages, posts, and categories
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
const { asyncHandler } = require('../middleware/errorHandler');
const { upload } = require('../middleware/upload');

// ============================================
// PUBLIC ENDPOINTS (no auth required)
// ============================================

router.get('/public/pages/:slug', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, slug, title, content, updated_at FROM cms_pages
     WHERE slug = $1 AND status = 'published'`,
    [req.params.slug]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
  res.json(result.rows[0]);
}));

router.get('/public/posts', asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, category } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = `SELECT p.id, p.slug, p.title, p.excerpt, p.featured_image, p.published_at,
                      c.name AS category_name, c.slug AS category_slug,
                      u.name AS author_name
               FROM cms_posts p
               LEFT JOIN cms_categories c ON p.category_id = c.id
               LEFT JOIN users u ON p.author_id = u.id
               WHERE p.status = 'published'`;
  const params = [];
  let countQuery = `SELECT COUNT(*) FROM cms_posts p WHERE p.status = 'published'`;

  if (category) {
    params.push(category);
    query += ` AND c.slug = $${params.length}`;
    countQuery += ` AND c.slug = $${params.length}`;
  }

  query += ` ORDER BY p.published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), offset);

  const [posts, count] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, params.slice(0, -2)),
  ]);

  res.json({
    posts: posts.rows,
    pagination: {
      page: parseInt(page), limit: parseInt(limit),
      total: parseInt(count.rows[0].count),
      pages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit)),
    },
  });
}));

router.get('/public/posts/:slug', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.content, p.featured_image, p.published_at,
            c.name AS category_name, c.slug AS category_slug,
            u.name AS author_name
     FROM cms_posts p
     LEFT JOIN cms_categories c ON p.category_id = c.id
     LEFT JOIN users u ON p.author_id = u.id
     WHERE p.slug = $1 AND p.status = 'published'`,
    [req.params.slug]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
  res.json(result.rows[0]);
}));

router.get('/public/categories', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT c.id, c.name, c.slug, COUNT(p.id)::int AS post_count
     FROM cms_categories c
     LEFT JOIN cms_posts p ON p.category_id = c.id AND p.status = 'published'
     GROUP BY c.id ORDER BY c.name`
  );
  res.json(result.rows);
}));

// ============================================
// PROTECTED ADMIN ENDPOINTS
// ============================================

// --- Pages ---

router.get('/pages',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT * FROM cms_pages`;
    let countQuery = `SELECT COUNT(*) FROM cms_pages`;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
      countQuery += ` WHERE status = $${params.length}`;
    }

    query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [pages, count] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      pages: pages.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(count.rows[0].count) },
    });
  })
);

router.post('/pages',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { slug, title, content, status = 'draft' } = req.body;
    const existing = await pool.query('SELECT id FROM cms_pages WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'A page with this slug already exists' });

    const result = await pool.query(
      `INSERT INTO cms_pages (slug, title, content, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [slug.trim(), title.trim(), content, status, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  })
);

router.put('/pages/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { slug, title, content, status } = req.body;
    const { id } = req.params;

    if (slug) {
      const existing = await pool.query('SELECT id FROM cms_pages WHERE slug = $1 AND id != $2', [slug, id]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'A page with this slug already exists' });
    }

    const result = await pool.query(
      `UPDATE cms_pages SET
         slug = COALESCE($1, slug), title = COALESCE($2, title),
         content = COALESCE($3, content), status = COALESCE($4, status),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [slug?.trim(), title?.trim(), content, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json(result.rows[0]);
  })
);

router.delete('/pages/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM cms_pages WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json({ message: 'Page deleted successfully' });
  })
);

// --- Posts ---

router.get('/posts',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT p.*, c.name AS category_name
                 FROM cms_posts p
                 LEFT JOIN cms_categories c ON p.category_id = c.id`;
    let countQuery = `SELECT COUNT(*) FROM cms_posts p LEFT JOIN cms_categories c ON p.category_id = c.id`;
    const params = [];
    const conditions = [];

    if (status) { conditions.push(`p.status = $${params.length + 1}`); params.push(status); }
    if (category) { conditions.push(`c.slug = $${params.length + 1}`); params.push(category); }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    query += ` ORDER BY p.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [posts, count] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      posts: posts.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(count.rows[0].count) },
    });
  })
);

router.post('/posts',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { slug, title, excerpt, content, featured_image, category_id, status = 'draft' } = req.body;
    const existing = await pool.query('SELECT id FROM cms_posts WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'A post with this slug already exists' });

    const published_at = status === 'published' ? new Date().toISOString() : null;

    const result = await pool.query(
      `INSERT INTO cms_posts (slug, title, excerpt, content, featured_image, category_id, status, author_id, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [slug.trim(), title.trim(), excerpt || '', content, featured_image || null, category_id || null, status, req.user.id, published_at]
    );
    res.status(201).json(result.rows[0]);
  })
);

router.put('/posts/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { slug, title, excerpt, content, featured_image, category_id, status } = req.body;
    const { id } = req.params;

    if (slug) {
      const existing = await pool.query('SELECT id FROM cms_posts WHERE slug = $1 AND id != $2', [slug, id]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'A post with this slug already exists' });
    }

    const published_at = status === 'published' ? new Date().toISOString() : undefined;

    const result = await pool.query(
      `UPDATE cms_posts SET
         slug = COALESCE($1, slug), title = COALESCE($2, title),
         excerpt = COALESCE($3, excerpt), content = COALESCE($4, content),
         featured_image = COALESCE($5, featured_image), category_id = $6,
         status = COALESCE($7, status),
         published_at = COALESCE($8, published_at),
         updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [slug?.trim(), title?.trim(), excerpt, content, featured_image, category_id, status, published_at, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  })
);

router.delete('/posts/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM cms_posts WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  })
);

// --- Categories ---

router.get('/categories',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM cms_categories ORDER BY name');
    res.json(result.rows);
  })
);

router.post('/categories',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { name, slug } = req.body;
    const existing = await pool.query('SELECT id FROM cms_categories WHERE slug = $1 OR name = $2', [slug, name]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Category already exists' });

    const result = await pool.query(
      `INSERT INTO cms_categories (name, slug, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [name.trim(), slug.trim()]
    );
    res.status(201).json(result.rows[0]);
  })
);

router.put('/categories/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { name, slug } = req.body;
    const { id } = req.params;

    if (slug) {
      const existing = await pool.query('SELECT id FROM cms_categories WHERE slug = $1 AND id != $2', [slug, id]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'A category with this slug already exists' });
    }

    const result = await pool.query(
      `UPDATE cms_categories SET name = COALESCE($1, name), slug = COALESCE($2, slug)
       WHERE id = $3 RETURNING *`,
      [name?.trim(), slug?.trim(), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  })
);

router.delete('/categories/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM cms_categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  })
);

// --- Image Upload ---

router.post('/upload',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    res.json({ url: `/uploads/${req.file.filename}` });
  })
);

module.exports = router;
