// routes/events.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/roleAuth');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyByRole } = require('../utils/notifications');
const { isAdmin } = require('../utils/roleHelpers');

async function notifyAllInnovators(eventTitle) {
  await notifyByRole(
    'innovator',
    'New Event Published',
    `A new event "${eventTitle}" has been published. Check it out!`,
    'info',
    '/events'
  );
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/events/public
 * Get all published events (public access)
 */
router.get('/public', asyncHandler(async (req, res) => {
  const { category, upcoming } = req.query;

  let query = `
    SELECT
      e.*,
      u.name as creator_name,
      u.email as creator_email
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.deleted_at IS NULL
  `;

  const params = [];
  let paramIndex = 1;

  if (category) {
    query += ` AND e.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (upcoming === 'true') {
    query += ` AND e.start_date >= CURRENT_DATE`;
  }

  query += ` ORDER BY e.start_date DESC, e.created_at DESC`;

  const result = await pool.query(query, params);
  res.json({ events: result.rows, total: result.rows.length });
}));

/**
 * GET /api/events/public/:id
 * Get single published event details (public access)
 */
router.get('/public/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT
      e.*,
      u.name as creator_name,
      u.email as creator_email
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = $1 AND e.deleted_at IS NULL
  `, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json({ event: result.rows[0] });
}));

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * GET /api/events
 * Get all events (admins see all, users see only non-deleted)
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      e.*,
      u.name as creator_name,
      u.email as creator_email
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Non-admins can only see non-deleted events
  if (!isAdmin(req.user.role)) {
    query += ` AND e.deleted_at IS NULL`;
  }

  if (category) {
    query += ` AND e.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  const countResult = await pool.query(`SELECT COUNT(*) FROM events WHERE 1=1`);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    events: result.rows,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  });
}));

/**
 * GET /api/events/:id
 * Get single event details (auth required)
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = `
    SELECT
      e.*,
      u.name as creator_name,
      u.email as creator_email
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = $1
  `;

  // Non-admins can only see non-deleted events
  if (!isAdmin(req.user.role)) {
    query += ` AND e.deleted_at IS NULL`;
  }

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json({ event: result.rows[0] });
}));

/**
 * POST /api/events
 * Create new event (admin/superAdmin only)
 */
router.post('/',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'create'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const {
      title,
      type,
      description,
      start_date,
      end_date,
      submission_deadline,
      location,
      capacity,
      requirements,
      prize,
      tags,
      published,
      banner_image
    } = req.body;

    // Validation
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const result = await pool.query(`
      INSERT INTO events (
        title, type, description, start_date, end_date, submission_deadline,
        location, capacity, requirements, prize, tags, published, banner_image, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      title, type, description, start_date, end_date, submission_deadline,
      location, capacity, requirements, prize, tags, published || false, banner_image, req.user.id
    ]);

    // Notify all innovators if event is published immediately
    if (published) {
      await notifyAllInnovators(title);
    }

    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });
  })
);

/**
 * PUT /api/events/:id
 * Update event (admin/superAdmin only)
 */
router.put('/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'update'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      title,
      type,
      description,
      start_date,
      end_date,
      submission_deadline,
      location,
      capacity,
      requirements,
      prize,
      tags,
      published,
      banner_image
    } = req.body;

    // Check if event exists
    const checkResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await pool.query(`
      UPDATE events
      SET
        title = COALESCE($1, title),
        type = COALESCE($2, type),
        description = COALESCE($3, description),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date),
        submission_deadline = COALESCE($6, submission_deadline),
        location = COALESCE($7, location),
        capacity = COALESCE($8, capacity),
        requirements = COALESCE($9, requirements),
        prize = COALESCE($10, prize),
        tags = COALESCE($11, tags),
        published = COALESCE($12, published),
        banner_image = COALESCE($13, banner_image),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `, [
      title, type, description, start_date, end_date, submission_deadline,
      location, capacity, requirements, prize, tags, published, banner_image, id
    ]);

    res.json({
      message: 'Event updated successfully',
      event: result.rows[0]
    });
  })
);

/**
 * DELETE /api/events/:id
 * Delete event (admin/superAdmin only)
 */
router.delete('/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'delete'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if event exists
    const checkResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  })
);

/**
 * PUT /api/events/:id/publish
 * Publish/unpublish event (admin/superAdmin only)
 */
router.put('/:id/publish',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'update'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { published } = req.body;

    const result = await pool.query(`
      UPDATE events
      SET published = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [published, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Notify all innovators when an event is published
    if (published) {
      await notifyAllInnovators(result.rows[0].title);
    }

    res.json({
      message: `Event ${published ? 'published' : 'unpublished'} successfully`,
      event: result.rows[0]
    });
  })
);

// ============================================
// EVENT SUBMISSIONS ROUTES
// ============================================

/**
 * POST /api/events/:id/submit
 * Submit entry to event (authenticated users)
 */
router.post('/:id/submit',
  authenticateToken,
  auditLog('event_submissions'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      title,
      team_name,
      members,
      description,
      problem_statement,
      solution,
      pitch_url
    } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user already submitted to this event
    const existingSubmission = await pool.query(
      'SELECT * FROM event_submissions WHERE event_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted to this event' });
    }

    const result = await pool.query(`
      INSERT INTO event_submissions (
        event_id, user_id, title, team_name, members, description,
        problem_statement, solution, pitch_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'submitted')
      RETURNING *
    `, [id, req.user.id, title, team_name, members, description, problem_statement, solution, pitch_url]);

    res.status(201).json({
      message: 'Submission successful',
      submission: result.rows[0]
    });
  })
);

/**
 * GET /api/events/:id/submissions
 * Get submissions for an event (admin/superAdmin see all, users see own)
 */
router.get('/:id/submissions',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    let query = `
      SELECT
        es.*,
        u.name as user_name,
        u.email as user_email,
        e.title as event_title
      FROM event_submissions es
      LEFT JOIN users u ON es.user_id = u.id
      LEFT JOIN events e ON es.event_id = e.id
      WHERE es.event_id = $1
    `;

    const params = [id];

    // Non-admins only see their own submissions
    if (!isAdmin(req.user.role)) {
      query += ` AND es.user_id = $2`;
      params.push(req.user.id);
    }

    query += ` ORDER BY es.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ submissions: result.rows, total: result.rows.length });
  })
);

/**
 * GET /api/events/submissions/my
 * Get current user's submissions
 */
router.get('/submissions/my',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT
        es.*,
        e.title as event_title,
        e.start_date,
        e.category
      FROM event_submissions es
      LEFT JOIN events e ON es.event_id = e.id
      WHERE es.user_id = $1
      ORDER BY es.created_at DESC
    `, [req.user.id]);

    res.json({ submissions: result.rows, total: result.rows.length });
  })
);

/**
 * GET /api/events/submissions/all
 * Get all submissions across all events
 * Access: admin, superAdmin only
 */
router.get('/submissions/all',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { status, event_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        es.*,
        u.name as user_name,
        u.email as user_email,
        e.title as event_title,
        e.start_date,
        e.category
      FROM event_submissions es
      LEFT JOIN users u ON es.user_id = u.id
      LEFT JOIN events e ON es.event_id = e.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND es.status = $${params.length}`;
    }

    if (event_id) {
      params.push(event_id);
      query += ` AND es.event_id = $${params.length}`;
    }

    query += ` ORDER BY es.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count with same filters
    let countQuery = 'SELECT COUNT(*) FROM event_submissions es WHERE 1=1';
    const countParams = [];

    if (status) {
      countParams.push(status);
      countQuery += ` AND es.status = $${countParams.length}`;
    }

    if (event_id) {
      countParams.push(event_id);
      countQuery += ` AND es.event_id = $${countParams.length}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      submissions: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  })
);

/**
 * PUT /api/events/submissions/:submissionId/status
 * Update submission status (admin/superAdmin only)
 */
router.put('/submissions/:submissionId/status',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  auditLog('event_submissions'),
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { status } = req.body;

    const validStatuses = ['submitted', 'reviewing', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE event_submissions
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      message: 'Submission status updated',
      submission: result.rows[0]
    });
  })
);

/**
 * POST /api/events/submissions/:submissionId/feedback
 * Add feedback to submission (admin/superAdmin only)
 */
router.post('/submissions/:submissionId/feedback',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  auditLog('event_submissions'),
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { feedback } = req.body;

    if (!feedback || feedback.trim() === '') {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    const result = await pool.query(
      `INSERT INTO submission_feedback (submission_id, admin_id, feedback)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [submissionId, req.user.id, feedback]
    );

    res.status(201).json({
      message: 'Feedback added successfully',
      feedback: result.rows[0]
    });
  })
);

/**
 * GET /api/events/submissions/:submissionId/feedback
 * Get feedback for submission
 */
router.get('/submissions/:submissionId/feedback',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;

    const result = await pool.query(`
      SELECT
        sf.*,
        u.name as admin_name
      FROM submission_feedback sf
      LEFT JOIN users u ON sf.admin_id = u.id
      WHERE sf.submission_id = $1
      ORDER BY sf.created_at DESC
    `, [submissionId]);

    res.json({ feedback: result.rows, total: result.rows.length });
  })
);

module.exports = router;
