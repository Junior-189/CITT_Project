/**
 * Contact Routes
 * Purpose: Public contact form submission + admin inbox
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifications');

/**
 * POST /api/contact
 * Submit a contact message (public endpoint)
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required: name, email, subject, message' });
  }

  if (message.length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters' });
  }

  await pool.query(
    `INSERT INTO contact_messages (name, email, subject, message, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [name.trim(), email.trim(), subject.trim(), message.trim()]
  );

  // Notify admins
  const admins = await pool.query(
    `SELECT id FROM users WHERE role IN ('admin','superAdmin') AND deleted_at IS NULL AND account_status='approved'`
  );
  for (const admin of admins.rows) {
    await createNotification(
      admin.id,
      'New Contact Message',
      `${name} sent a message: "${subject}"`,
      'info',
      '/admin/contact'
    );
  }

  res.status(201).json({ message: 'Your message has been received. We will get back to you soon.' });
}));

/**
 * GET /api/contact
 * List all contact messages (admin only)
 */
router.get('/',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [messages, count] = await Promise.all([
      pool.query(
        `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [parseInt(limit), offset]
      ),
      pool.query('SELECT COUNT(*) FROM contact_messages')
    ]);

    res.json({
      messages: messages.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count.rows[0].count),
        pages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit))
      }
    });
  })
);

/**
 * PUT /api/contact/mark-all-read
 * Mark all unread messages as read
 */
router.put('/mark-all-read',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `UPDATE contact_messages SET is_read = TRUE WHERE is_read = FALSE`
    );
    res.json({ message: 'All marked as read', count: result.rowCount });
  })
);

/**
 * PUT /api/contact/:id/read
 * Mark a single message as read
 */
router.put('/:id/read',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `UPDATE contact_messages SET is_read = TRUE WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Marked as read' });
  })
);

module.exports = router;
