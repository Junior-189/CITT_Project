/**
 * IP Manager Routes
 * Purpose: IP Manager-specific functionality
 * Access: ipManager, admin, superAdmin roles
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/roleAuth');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifications');

/**
 * GET /api/ipmanager/dashboard
 * Get IP Manager dashboard statistics
 * Access: ipManager, admin, superAdmin
 */
router.get('/dashboard',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const [stats, recentIP] = await Promise.all([
      // IP Management statistics
      pool.query(`
        SELECT
          COUNT(*) as total_records,
          COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM ip_management
      `),

      // Recent IP submissions
      pool.query(`
        SELECT
          ip.id,
          COALESCE(ip.title, ip.ip_title) as title,
          ip.ip_type,
          ip.approval_status,
          ip.created_at,
          u.name as user_name,
          u.email as user_email
        FROM ip_management ip
        JOIN users u ON ip.user_id = u.id
        ORDER BY ip.created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      stats: stats.rows[0],
      recentSubmissions: recentIP.rows
    });
  })
);

/**
 * GET /api/ipmanager/ip-records
 * Get all IP records with filtering
 * Access: ipManager, admin, superAdmin
 */
router.get('/ip-records',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { approval_status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ip.*, COALESCE(ip.title, ip.ip_title) as title,
             u.name as user_name, u.email as user_email,
             approver.name as approved_by_name
      FROM ip_management ip
      JOIN users u ON ip.user_id = u.id
      LEFT JOIN users approver ON ip.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];

    if (approval_status) {
      params.push(approval_status);
      query += ` AND ip.approval_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (COALESCE(ip.title, ip.ip_title) ILIKE $${params.length} OR ip.description ILIKE $${params.length} OR ip.inventors ILIKE $${params.length})`;
    }

    query += ` ORDER BY ip.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM ip_management');

    res.json({
      ipRecords: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  })
);

/**
 * GET /api/ipmanager/ip-records/:id
 * Get single IP record details
 * Access: ipManager, admin, superAdmin
 */
router.get('/ip-records/:id',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT ip.*, COALESCE(ip.title, ip.ip_title) as title,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             approver.name as approved_by_name
      FROM ip_management ip
      JOIN users u ON ip.user_id = u.id
      LEFT JOIN users approver ON ip.approved_by = approver.id
      WHERE ip.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP record not found' });
    }

    res.json(result.rows[0]);
  })
);

/**
 * PUT /api/ipmanager/ip-records/:id/approve
 * Approve IP application
 * Access: ipManager, admin, superAdmin
 */
router.put('/ip-records/:id/approve',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  checkPermission('ip_management', 'approve'),
  auditLog('ip_management'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await pool.query(`
      UPDATE ip_management
      SET approval_status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP record not found' });
    }

    // Notify IP applicant
    const ipRecord = result.rows[0];
    const ipTitle = ipRecord.title || ipRecord.ip_title || 'Untitled';
    await createNotification(
      ipRecord.user_id,
      'IP Application Approved',
      `Your IP application "${ipTitle}" has been approved.`,
      'success',
      '/ip'
    );

    res.json({
      message: 'IP application approved successfully',
      ipRecord: result.rows[0],
      comments
    });
  })
);

/**
 * PUT /api/ipmanager/ip-records/:id/reject
 * Reject IP application
 * Access: ipManager, admin, superAdmin
 */
router.put('/ip-records/:id/reject',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  checkPermission('ip_management', 'reject'),
  auditLog('ip_management'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await pool.query(`
      UPDATE ip_management
      SET approval_status = 'rejected',
          rejection_reason = $1,
          approved_by = $2,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [reason, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP record not found' });
    }

    // Notify IP applicant
    const ipRecord = result.rows[0];
    const ipTitle = ipRecord.title || ipRecord.ip_title || 'Untitled';
    await createNotification(
      ipRecord.user_id,
      'IP Application Rejected',
      `Your IP application "${ipTitle}" has been rejected. Reason: ${reason}`,
      'warning',
      '/ip'
    );

    res.json({
      message: 'IP application rejected',
      ipRecord: result.rows[0]
    });
  })
);

/**
 * PUT /api/ipmanager/ip-records/:id
 * Update IP record details (for IP Manager to update records)
 * Access: ipManager, admin, superAdmin
 */
router.put('/ip-records/:id',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  checkPermission('ip_management', 'update'),
  auditLog('ip_management'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, ip_type, status, inventors, field, abstract: ipAbstract, trl, patent_number, prior_art } = req.body;

    const result = await pool.query(`
      UPDATE ip_management
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          ip_type = COALESCE($3, ip_type),
          status = COALESCE($4, status),
          inventors = COALESCE($5, inventors),
          field = COALESCE($6, field),
          abstract = COALESCE($7, abstract),
          trl = COALESCE($8, trl),
          patent_number = COALESCE($9, patent_number),
          prior_art = COALESCE($10, prior_art),
          updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [title, description, ip_type, status, inventors, field, ipAbstract, trl, patent_number, prior_art, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP record not found' });
    }

    res.json({
      message: 'IP record updated successfully',
      ipRecord: result.rows[0]
    });
  })
);

/**
 * DELETE /api/ipmanager/ip-records/:id
 * Delete IP record
 * Access: ipManager, admin, superAdmin
 */
router.delete('/ip-records/:id',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  checkPermission('ip_management', 'delete'),
  auditLog('ip_management'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM ip_management WHERE id = $1 RETURNING COALESCE(title, ip_title) as title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP record not found' });
    }

    res.json({
      message: 'IP record deleted successfully',
      ipTitle: result.rows[0].title
    });
  })
);

/**
 * GET /api/ipmanager/statistics
 * Get IP-related statistics for charts
 * Access: ipManager, admin, superAdmin
 */
router.get('/statistics',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const [byStatus, byType, monthlyTrend] = await Promise.all([
      // Count by approval status
      pool.query(`
        SELECT approval_status, COUNT(*) as count
        FROM ip_management
        GROUP BY approval_status
      `),

      // Count by IP type (if ip_type column exists)
      pool.query(`
        SELECT ip_type, COUNT(*) as count
        FROM ip_management
        WHERE ip_type IS NOT NULL
        GROUP BY ip_type
      `).catch(() => ({ rows: [] })), // Handle if column doesn't exist

      // Monthly trend (last 6 months)
      pool.query(`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count
        FROM ip_management
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
      `)
    ]);

    res.json({
      byStatus: byStatus.rows,
      byType: byType.rows,
      monthlyTrend: monthlyTrend.rows
    });
  })
);

/**
 * GET /api/ipmanager/pending
 * Get all pending IP applications (quick access)
 * Access: ipManager, admin, superAdmin
 */
router.get('/pending',
  authenticateToken,
  checkRole(['ipManager', 'admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT ip.*, COALESCE(ip.title, ip.ip_title) as title,
             u.name as user_name, u.email as user_email
      FROM ip_management ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.approval_status = 'pending'
      ORDER BY ip.created_at ASC
    `);

    res.json({
      count: result.rows.length,
      pending: result.rows
    });
  })
);

module.exports = router;
