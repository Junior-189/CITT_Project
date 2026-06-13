/**
 * IP Manager Routes
 * Purpose: IP Manager-specific functionality
 * Access: ipManager, admin, superAdmin roles
 * Also includes innovator-facing endpoints (submit, my-ips)
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/roleAuth');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifications');
const { validate } = require('../middleware/validate');
const { ipCreateSchema } = require('../validators/ip');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ipUploadDir = path.join(__dirname, '../uploads/ip');
if (!fs.existsSync(ipUploadDir)) fs.mkdirSync(ipUploadDir, { recursive: true });
const ALLOWED_IP_MIMES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/jpg','image/png'];
const ipUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ipUploadDir),
    filename: (req, file, cb) => cb(null, `ip_${Date.now()}_${Math.round(Math.random()*1e6)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extOk = /\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(path.extname(file.originalname));
    const mimeOk = ALLOWED_IP_MIMES.includes(file.mimetype);
    return (extOk && mimeOk) ? cb(null, true) : cb(new Error('Only PDF, Word, JPG, PNG allowed'));
  }
});

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

    // Record status history
    const ipRecord = result.rows[0];
    await pool.query(
      `INSERT INTO ip_status_history (ip_id, old_status, new_status, changed_by, note, created_at)
       VALUES ($1, $2, 'Patent Granted', $3, $4, NOW())`,
      [ipRecord.id, ipRecord.status || null, req.user.id, comments || 'Approved']
    );

    // Update status to Patent Granted
    await pool.query(`UPDATE ip_management SET status = 'Patent Granted' WHERE id = $1`, [ipRecord.id]);

    // Notify IP applicant
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

    // Record status history
    const ipRecord = result.rows[0];
    await pool.query(
      `INSERT INTO ip_status_history (ip_id, old_status, new_status, changed_by, note, created_at)
       VALUES ($1, $2, 'Rejected', $3, $4, NOW())`,
      [ipRecord.id, ipRecord.status || null, req.user.id, reason]
    );

    // Update status to Rejected
    await pool.query(`UPDATE ip_management SET status = 'Rejected' WHERE id = $1`, [ipRecord.id]);

    // Notify IP applicant
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

// ============================================
// INNOVATOR-FACING IP ENDPOINTS
// ============================================

/**
 * GET /api/ipmanager/my-ips
 * Innovator sees their own IP records with aggregated documents
 * Access: any authenticated user
 */
router.get('/my-ips', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT ip.*,
       COALESCE(json_agg(json_build_object('id', d.id, 'file_name', d.file_name, 'file_url', d.file_url))
         FILTER (WHERE d.id IS NOT NULL), '[]') AS documents
     FROM ip_management ip
     LEFT JOIN ip_documents d ON d.ip_id = ip.id
     WHERE ip.user_id = $1 AND ip.deleted_at IS NULL
     GROUP BY ip.id
     ORDER BY ip.created_at DESC`,
    [req.user.id]
  );
  res.json({ ips: result.rows });
}));

/**
 * POST /api/ipmanager/submit
 * Innovator submits a new IP application with file uploads
 * Access: any authenticated user
 */
router.post('/submit', authenticateToken, validate(ipCreateSchema.passthrough()), ipUpload.array('files', 10), asyncHandler(async (req, res) => {
  const {
    ip_type, title, inventors, abstract, field, milestone_stage, prior_art, project_id,
    patent_number, application_number, trademark_reg_number, trademark_classification,
    copyright_reg_number, copyright_type, design_reg_number, design_classification
  } = req.body;

  if (!ip_type || !title || !inventors) {
    return res.status(400).json({ error: 'IP type, title, and inventors are required' });
  }

  const insert = await pool.query(
    `INSERT INTO ip_management
      (user_id, created_by, ip_type, title, inventors, abstract, field, milestone_stage, prior_art, project_id,
       patent_number, application_number, trademark_reg_number, trademark_classification,
       copyright_reg_number, copyright_type, design_reg_number, design_classification,
       status, approval_status, created_at, updated_at)
     VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'Submitted','pending',NOW(),NOW())
     RETURNING *`,
    [req.user.id, ip_type, title, inventors, abstract || null, field || null, milestone_stage || null,
     prior_art || null, project_id || null, patent_number || null, application_number || null,
     trademark_reg_number || null, trademark_classification || null, copyright_reg_number || null,
     copyright_type || null, design_reg_number || null, design_classification || null]
  );
  const ip = insert.rows[0];

  // Save uploaded files
  if (req.files && req.files.length) {
    for (const f of req.files) {
      await pool.query(
        `INSERT INTO ip_documents (ip_id, file_name, file_url, file_size, mime_type, uploaded_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
        [ip.id, f.originalname, `/uploads/ip/${f.filename}`, f.size, f.mimetype, req.user.id]
      );
    }
  }

  // Record status history
  await pool.query(
    `INSERT INTO ip_status_history (ip_id, old_status, new_status, changed_by, note, created_at)
     VALUES ($1, NULL, 'Submitted', $2, 'IP application submitted', NOW())`,
    [ip.id, req.user.id]
  );

  // Notify IP managers + admins
  const reviewers = await pool.query(
    `SELECT id FROM users WHERE role IN ('ipManager','admin','superAdmin') AND deleted_at IS NULL AND account_status='approved'`
  );
  for (const r of reviewers.rows) {
    await createNotification(r.id, 'New IP Application',
      `A new ${ip_type} IP "${title}" was submitted and awaits review.`, 'ip_submitted', '/ipmanager/dashboard');
  }

  res.status(201).json({ message: 'IP application submitted successfully', ip });
}));

/**
 * GET /api/ipmanager/my-ips/:id/history
 * Status history for an IP (owner or reviewer)
 * Access: IP owner or reviewer roles
 */
router.get('/my-ips/:id/history', authenticateToken, asyncHandler(async (req, res) => {
  const ipRes = await pool.query('SELECT user_id FROM ip_management WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (!ipRes.rows.length) return res.status(404).json({ error: 'IP not found' });
  const isOwner = Number(ipRes.rows[0].user_id) === Number(req.user.id);
  const isReviewer = ['ipManager','admin','superAdmin'].includes(req.user.role);
  if (!isOwner && !isReviewer) return res.status(403).json({ error: 'Access denied' });
  const h = await pool.query(
    `SELECT sh.*, u.name AS changed_by_name FROM ip_status_history sh
     LEFT JOIN users u ON u.id = sh.changed_by WHERE sh.ip_id = $1 ORDER BY sh.created_at ASC`,
    [req.params.id]
  );
  res.json({ history: h.rows });
}));

// ============================================
// COMMERCIALIZATION / LICENSE ENDPOINTS
// ============================================

/**
 * GET /api/ipmanager/licenses
 * List licenses - all for reviewers, own for innovators
 * Access: any authenticated user
 */
router.get('/licenses', authenticateToken, asyncHandler(async (req, res) => {
  const isReviewer = ['ipManager','admin','superAdmin'].includes(req.user.role);
  const q = isReviewer
    ? `SELECT l.*, ip.title AS ip_title FROM ip_licenses l JOIN ip_management ip ON ip.id = l.ip_id ORDER BY l.created_at DESC`
    : `SELECT l.*, ip.title AS ip_title FROM ip_licenses l JOIN ip_management ip ON ip.id = l.ip_id WHERE ip.user_id = $1 ORDER BY l.created_at DESC`;
  const result = isReviewer ? await pool.query(q) : await pool.query(q, [req.user.id]);
  res.json({ licenses: result.rows });
}));

/**
 * POST /api/ipmanager/licenses
 * Create a license for a granted IP
 * Access: ipManager, admin, superAdmin
 */
router.post('/licenses', authenticateToken, checkRole(['ipManager','admin','superAdmin']), asyncHandler(async (req, res) => {
  const { ip_id, licensee, royalty_rate, terms } = req.body;
  if (!ip_id || !licensee) return res.status(400).json({ error: 'ip_id and licensee are required' });
  const ipRes = await pool.query('SELECT status FROM ip_management WHERE id = $1 AND deleted_at IS NULL', [ip_id]);
  if (!ipRes.rows.length) return res.status(404).json({ error: 'IP not found' });
  if (!['Patent Granted','Granted','Published'].includes(ipRes.rows[0].status)) {
    return res.status(400).json({ error: 'Only granted or published IPs can be licensed' });
  }
  const result = await pool.query(
    `INSERT INTO ip_licenses (ip_id, licensee, royalty_rate, terms, created_by, created_at)
     VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
    [ip_id, licensee, royalty_rate || null, terms || null, req.user.id]
  );
  res.status(201).json({ message: 'License created', license: result.rows[0] });
}));

/**
 * POST /api/ipmanager/licenses/:id/royalty
 * Record a royalty payment for a license
 * Access: ipManager, admin, superAdmin
 */
router.post('/licenses/:id/royalty', authenticateToken, checkRole(['ipManager','admin','superAdmin']), asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount is required' });
  const result = await pool.query(
    `INSERT INTO ip_royalties (license_id, amount, note, recorded_by, created_at)
     VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
    [req.params.id, amount, note || null, req.user.id]
  );
  res.status(201).json({ message: 'Royalty recorded', royalty: result.rows[0] });
}));

module.exports = router;
