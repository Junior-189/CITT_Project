/**
 * Admin Routes
 * Purpose: Admin-specific functionality (user management, approvals, analytics)
 * Access: admin, superAdmin roles only
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/roleAuth');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotification, notifyAdmins } = require('../utils/notifications');
const { isAdmin, isReviewer } = require('../utils/roleHelpers');

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 * Access: admin, superAdmin
 */
router.get('/users',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, phone, role, university, college,
             year_of_study, profile_complete, created_at, updated_at
      FROM users
      WHERE deleted_at IS NULL
    `;
    const params = [];

    // Filter by role
    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    // Search by name or email
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count (exclude soft-deleted users)
    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');

    res.json({
      users: result.rows,
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
 * GET /api/admin/users/:id
 * Get single user details
 * Access: admin, superAdmin
 */
router.get('/users/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT id, name, email, phone, role, university, college,
             year_of_study, profile_complete, firestore_id,
             created_at, updated_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's projects, funding, IP records count
    const [projects, funding, ip] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM projects WHERE user_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM funding WHERE user_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM ip_management WHERE user_id = $1', [id])
    ]);

    res.json({
      ...result.rows[0],
      stats: {
        projects: parseInt(projects.rows[0].count),
        funding: parseInt(funding.rows[0].count),
        ipRecords: parseInt(ip.rows[0].count)
      }
    });
  })
);

/**
 * PUT /api/admin/users/:id
 * Update user information (admin can update any user)
 * Access: admin, superAdmin
 */
router.put('/users/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, university, college, year_of_study, profile_complete } = req.body;

    const result = await pool.query(`
      UPDATE users
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          university = COALESCE($4, university),
          college = COALESCE($5, college),
          year_of_study = COALESCE($6, year_of_study),
          profile_complete = COALESCE($7, profile_complete),
          updated_at = NOW()
      WHERE id = $8
      RETURNING id, name, email, phone, role, university, college, year_of_study, profile_complete
    `, [name, email, phone, university, college, year_of_study, profile_complete, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  })
);

/**
 * DELETE /api/admin/users/:id
 * Soft delete a user (marks as deleted, can be restored later)
 * Access: admin, superAdmin
 */
router.delete('/users/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists and get their role
    const userCheck = await pool.query('SELECT role, name, email FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or already deleted' });
    }

    // Admins cannot delete superAdmins
    if (req.user.role === 'admin' && userCheck.rows[0].role === 'superAdmin') {
      return res.status(403).json({ error: 'Admins cannot delete superAdmins' });
    }

    // Cannot delete yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Soft delete: Set deleted_at and deleted_by instead of actually deleting
    const result = await pool.query(
      `UPDATE users
       SET deleted_at = NOW(), deleted_by = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING email, name`,
      [req.user.id, id]
    );

    res.json({
      message: 'User deleted successfully (can be restored from Past Users)',
      deletedUser: result.rows[0]
    });
  })
);

// ============================================
// PROJECT MANAGEMENT
// ============================================

/**
 * GET /api/admin/projects
 * Get all projects with filters
 * Access: authenticated users (admins see all, users see only their own)
 */
router.get('/projects',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { approval_status, project_status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userIsReviewer = isReviewer(req.user.role);

    let query = `
      SELECT p.*, u.name as user_name, u.email as user_email,
             approver.name as approved_by_name
      FROM projects p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];

    // Non-reviewer users only see their own projects
    if (!userIsReviewer) {
      params.push(req.user.id);
      query += ` AND p.user_id = $${params.length}`;
    }

    if (approval_status) {
      params.push(approval_status);
      query += ` AND p.approval_status = $${params.length}`;
    }

    if (project_status) {
      params.push(project_status);
      query += ` AND p.project_status = $${params.length}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    // Count only user's projects for non-reviewers
    let countResult;
    if (!userIsReviewer) {
      countResult = await pool.query('SELECT COUNT(*) FROM projects WHERE user_id = $1', [req.user.id]);
    } else {
      countResult = await pool.query('SELECT COUNT(*) FROM projects');
    }

    res.json({
      projects: result.rows,
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
 * POST /api/admin/projects
 * Create a new project (available to authenticated users)
 * Access: Any authenticated user (innovators/researchers)
 */
router.post('/projects',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { title, description, category, institution, funding_needed, problem_statement, project_status } = req.body;

    const validProjectStatuses = ['submitted', 'on_progress', 'completed'];
    const nextProjectStatus = project_status || 'submitted';
    if (project_status && !validProjectStatuses.includes(project_status)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }

    // Check whether optional columns exist in the projects table
    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='projects'
         AND column_name IN ('institution','funding_needed','problem_statement')`
    );
    const existingCols = colCheck.rows.map(r => r.column_name);
    const hasInstitution = existingCols.includes('institution');
    const hasFundingNeeded = existingCols.includes('funding_needed');
    const hasProblemStatement = existingCols.includes('problem_statement');

    // Validate required fields; only require institution/problem statement if columns exist
    if (
      !title ||
      !description ||
      !category ||
      (hasInstitution && !institution) ||
      (hasProblemStatement && !problem_statement)
    ) {
      return res.status(400).json({
        error: hasInstitution
          ? 'Title, description, category, and institution are required'
          : 'Title, description and category are required'
      });
    }

    // Build INSERT dynamically depending on which columns exist
    const insertColumns = ['user_id', 'title', 'description', 'category'];
    const insertValues = [req.user.id, title, description, category];

    if (hasInstitution) {
      insertColumns.push('institution');
      insertValues.push(institution);
    }

    if (hasFundingNeeded) {
      insertColumns.push('funding_needed');
      insertValues.push(funding_needed || 0);
    }

    if (hasProblemStatement) {
      insertColumns.push('problem_statement');
      insertValues.push(problem_statement);
    }

    insertColumns.push('approval_status', 'project_status');
    insertValues.push('pending', nextProjectStatus);

    const placeholders = insertValues.map((_, index) => `$${index + 1}`);
    const insertQuery = `
      INSERT INTO projects (${insertColumns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await pool.query(insertQuery, insertValues);

    // Notify admins about new project submission
    notifyAdmins(
      'New Project Submission',
      `New project "${title}" submitted by ${req.user.email}`,
      'info',
      '/admin/projects'
    );

    res.status(201).json({
      message: 'Project submitted successfully',
      project: result.rows[0]
    });
  })
);

/**
 * PUT /api/admin/projects/:id
 * Update a project (owner can update if pending, admin can always update)
 * Access: Project owner (if pending) or admin/superAdmin
 */
router.put('/projects/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, category, institution, funding_needed, problem_statement, project_status } = req.body;

    const validProjectStatuses = ['submitted', 'on_progress', 'completed'];
    if (project_status && !validProjectStatuses.includes(project_status)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }

    // Get project and check ownership/permissions
    const projectCheck = await pool.query(
      'SELECT user_id, approval_status FROM projects WHERE id = $1',
      [id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectCheck.rows[0];

    // Check permission: owner can edit if pending or rejected, admin/superAdmin can always edit
    const isOwner = project.user_id === req.user.id;
    const userIsAdmin = isAdmin(req.user.role);

    if (isOwner && !['pending', 'rejected'].includes(project.approval_status)) {
      return res.status(403).json({
        error: 'You can only edit projects that are pending review or rejected. This project is ' + project.approval_status
      });
    }

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ error: 'You do not have permission to update this project' });
    }

    // Check whether optional columns exist in the projects table
    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='projects'
         AND column_name IN ('institution','funding_needed','problem_statement')`
    );
    const existingCols = colCheck.rows.map(r => r.column_name);
    const hasInstitution = existingCols.includes('institution');
    const hasFundingNeeded = existingCols.includes('funding_needed');
    const hasProblemStatement = existingCols.includes('problem_statement');

    // Build dynamic UPDATE depending on whether institution exists
    const setClauses = [];
    const values = [];

    // For each field, use COALESCE-like behavior by allowing null to mean "no change"
    // We'll add the parameters in order
    setClauses.push(`title = COALESCE($${values.length + 1}, title)`); values.push(title);
    setClauses.push(`description = COALESCE($${values.length + 1}, description)`); values.push(description);
    setClauses.push(`category = COALESCE($${values.length + 1}, category)`); values.push(category);
    if (hasInstitution) {
      setClauses.push(`institution = COALESCE($${values.length + 1}, institution)`); values.push(institution);
    }
    if (hasFundingNeeded) {
      setClauses.push(`funding_needed = COALESCE($${values.length + 1}, funding_needed)`); values.push(funding_needed);
    }
    if (hasProblemStatement) {
      setClauses.push(`problem_statement = COALESCE($${values.length + 1}, problem_statement)`); values.push(problem_statement);
    }
    setClauses.push(`project_status = COALESCE($${values.length + 1}, project_status)`); values.push(project_status);

    // updated_at
    const updateSql = `
      UPDATE projects
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(updateSql, values);

    res.json({
      message: 'Project updated successfully',
      project: result.rows[0]
    });
  })
);

/**
 * PUT /api/admin/projects/:id/resubmit
 * Resubmit a rejected project for admin review
 * Access: Project owner (rejected) or admin/superAdmin
 */
router.put('/projects/:id/resubmit',
  authenticateToken,
  auditLog('projects'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const projectCheck = await pool.query(
      'SELECT id, user_id, approval_status FROM projects WHERE id = $1',
      [id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectCheck.rows[0];
    const isOwner = project.user_id === req.user.id;
    const userIsAdmin = isAdmin(req.user.role);

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ error: 'You do not have permission to resubmit this project' });
    }

    if (project.approval_status !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected projects can be resubmitted' });
    }

    const result = await pool.query(`
      UPDATE projects
      SET approval_status = 'pending',
          rejection_reason = NULL,
          approved_by = NULL,
          approved_at = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json({
      message: 'Project resubmitted for review',
      project: result.rows[0]
    });
  })
);

/**
 * PUT /api/admin/projects/:id/approve
 * Approve a project
 * Access: admin, superAdmin
 */
router.put('/projects/:id/approve',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('projects', 'approve'),
  auditLog('projects'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;

    const result = await pool.query(`
      UPDATE projects
      SET approval_status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Notify project owner
    const project = result.rows[0];
    await createNotification(
      project.user_id,
      'Project Approved',
      `Your project "${project.title}" has been approved.`,
      'success',
      '/my-projects'
    );

    res.json({
      message: 'Project approved successfully',
      project: result.rows[0],
      comments
    });
  })
);

/**
 * PUT /api/admin/projects/:id/reject
 * Reject a project
 * Access: admin, superAdmin
 */
router.put('/projects/:id/reject',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('projects', 'reject'),
  auditLog('projects'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await pool.query(`
      UPDATE projects
      SET approval_status = 'rejected',
          rejection_reason = $1,
          approved_by = $2,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [reason, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Notify project owner
    const project = result.rows[0];
    await createNotification(
      project.user_id,
      'Project Rejected',
      `Your project "${project.title}" has been rejected. Reason: ${reason}`,
      'warning',
      '/my-projects'
    );

    res.json({
      message: 'Project rejected',
      project: result.rows[0]
    });
  })
);

/**
 * DELETE /api/admin/projects/:id
 * Delete a project
 * Access: admin, superAdmin
 */
router.delete('/projects/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('projects', 'delete'),
  auditLog('projects'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING title', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      message: 'Project deleted successfully',
      projectTitle: result.rows[0].title
    });
  })
);

// ============================================
// FUNDING MANAGEMENT
// ============================================

/**
 * POST /api/admin/funding
 * Submit a new funding application
 * Access: Any authenticated user (innovators, researchers)
 */
router.post('/funding',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { title, description, amount, currency, project_id, grant_type } = req.body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : title;
    const parsedAmount = Number(amount);

    // Validate required fields
    if (!trimmedTitle || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ 
        error: 'Title and a valid amount are required' 
      });
    }

    let projectId = null;
    const projectIdValue = typeof project_id === 'string' ? project_id.trim() : project_id;
    if (projectIdValue !== undefined && projectIdValue !== null && String(projectIdValue).trim() !== '') {
      const projectIdString = String(projectIdValue).trim();
      if (!/^\d+$/.test(projectIdString)) {
        return res.status(400).json({
          error: 'project_id must be an integer project ID (do not send the project title)'
        });
      }

      projectId = Number(projectIdString);

      // Validate project exists (and belongs to user unless admin/superAdmin)
      const projectCheck = await pool.query(
        'SELECT id, user_id FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Project not found' });
      }

      const userIsAdmin = isAdmin(req.user.role);
      if (!userIsAdmin && Number(projectCheck.rows[0].user_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'You can only link funding applications to your own projects' });
      }
    }

    // Insert funding application
    const result = await pool.query(`
      INSERT INTO funding (
        user_id, project_id, title, description,
        amount, currency, grant_type,
        approval_status, funding_status,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      req.user.id,
      projectId,
      trimmedTitle,
      description || null,
      parsedAmount,
      currency || 'TZS',
      grant_type || 'research',
      'pending',
      'applied'
    ]);

    // Notify admins about new funding application
    notifyAdmins(
      'New Funding Application',
      `New funding application "${trimmedTitle}" (${parsedAmount.toLocaleString()} ${currency || 'TZS'}) submitted by ${req.user.email}`,
      'info',
      '/admin/funding'
    );

    res.status(201).json({
      message: 'Funding application submitted successfully',
      funding: result.rows[0]
    });
  })
);

/**
 * GET /api/admin/funding
 * Get all funding applications with filters
 * Access: All authenticated users (see own if not reviewer), reviewers see all
 */
router.get('/funding',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { approval_status, funding_status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userIsReviewer = isReviewer(req.user.role);

    let query = `
      SELECT f.*, u.name as user_name, u.email as user_email,
             approver.name as approved_by_name,
             p.title as project_title
      FROM funding f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN users approver ON f.approved_by = approver.id
      LEFT JOIN projects p ON f.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Non-reviewer users only see their own applications
    if (!userIsReviewer) {
      params.push(req.user.id);
      query += ` AND f.user_id = $${params.length}`;
    }

    if (approval_status) {
      params.push(approval_status);
      query += ` AND f.approval_status = $${params.length}`;
    }

    if (funding_status) {
      params.push(funding_status);
      query += ` AND f.funding_status = $${params.length}`;
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    // Count only user's applications for non-reviewers
    let countResult;
    if (!userIsReviewer) {
      countResult = await pool.query('SELECT COUNT(*) FROM funding WHERE user_id = $1', [req.user.id]);
    } else {
      countResult = await pool.query('SELECT COUNT(*) FROM funding');
    }

    res.json({
      funding: result.rows,
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
 * PUT /api/admin/funding/:id
 * Update a funding application (owner can edit if pending, admin can always edit)
 * Access: Application owner (if pending) or admin/superAdmin
 */
router.put('/funding/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, amount, currency, grant_type, project_id } = req.body;

    // Get application and check ownership/permissions
    const appCheck = await pool.query(
      'SELECT user_id, approval_status FROM funding WHERE id = $1',
      [id]
    );

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Funding application not found' });
    }

    const app = appCheck.rows[0];
    const isOwner = Number(app.user_id) === Number(req.user.id);
    const userIsAdmin = isAdmin(req.user.role);

    // Check permission:
    // - owner can edit while pending or after rejection (edit → resubmit)
    // - owner cannot edit once approved
    // - admin/superAdmin can always edit
    if (isOwner && app.approval_status === 'approved') {
      return res.status(403).json({ 
        error: 'You cannot edit funding applications that have already been approved' 
      });
    }

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ error: 'You do not have permission to update this application' });
    }

    // Validate amount (if provided)
    let parsedAmount = undefined;
    if (amount !== undefined && amount !== null && String(amount).trim() !== '') {
      parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
    }

    // Validate + normalize project_id (if provided)
    let projectId = undefined;
    if (Object.prototype.hasOwnProperty.call(req.body, 'project_id')) {
      const raw = project_id;

      if (raw === null || raw === undefined || String(raw).trim() === '') {
        projectId = null; // unlink
      } else {
        const rawString = String(raw).trim();
        if (!/^\d+$/.test(rawString)) {
          return res.status(400).json({ error: 'project_id must be an integer project ID' });
        }
        projectId = Number(rawString);

        const projectCheck = await pool.query(
          'SELECT id, user_id FROM projects WHERE id = $1',
          [projectId]
        );
        if (projectCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Project not found' });
        }
        if (!userIsAdmin && Number(projectCheck.rows[0].user_id) !== Number(req.user.id)) {
          return res.status(403).json({ error: 'You can only link funding applications to your own projects' });
        }
      }
    }

    // Build update query dynamically so we can explicitly set NULLs (e.g. unlink project)
    const setClauses = [];
    const values = [];

    if (title !== undefined) {
      const trimmedTitle = typeof title === 'string' ? title.trim() : title;
      if (!trimmedTitle) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      values.push(trimmedTitle);
      setClauses.push(`title = $${values.length}`);
    }

    if (description !== undefined) {
      values.push(description);
      setClauses.push(`description = $${values.length}`);
    }

    if (parsedAmount !== undefined) {
      values.push(parsedAmount);
      setClauses.push(`amount = $${values.length}`);
    }

    if (currency !== undefined) {
      values.push(currency);
      setClauses.push(`currency = $${values.length}`);
    }

    if (grant_type !== undefined) {
      values.push(grant_type);
      setClauses.push(`grant_type = $${values.length}`);
    }

    if (projectId !== undefined) {
      values.push(projectId);
      setClauses.push(`project_id = $${values.length}`);
    }

    // If owner edits a rejected application, treat this as a resubmission
    if (isOwner && app.approval_status === 'rejected') {
      setClauses.push(`approval_status = 'pending'`);
      setClauses.push(`rejection_reason = NULL`);
      setClauses.push(`approved_by = NULL`);
      setClauses.push(`approved_at = NULL`);
      setClauses.push(`funding_status = 'applied'`);
    }

    setClauses.push(`updated_at = NOW()`);

    values.push(id);
    const result = await pool.query(
      `UPDATE funding SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json({
      message: 'Funding application updated successfully',
      funding: result.rows[0]
    });
  })
);

/**
 * PUT /api/admin/funding/:id/approve
 * Approve funding application
 * Access: admin, superAdmin
 */
router.put('/funding/:id/approve',
  authenticateToken,
  checkRole(['admin', 'superAdmin', 'ipManager']),
  checkPermission('funding', 'approve'),
  auditLog('funding'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comments, amount_approved } = req.body;

    // If amount_approved is provided, save it; otherwise default to the requested amount
    let approvedAmount = null;
    if (amount_approved !== undefined && amount_approved !== null && String(amount_approved).trim() !== '') {
      approvedAmount = Number(amount_approved);
      if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
        return res.status(400).json({ error: 'Approved amount must be a positive number' });
      }
    }

    // Check if amount_approved column exists
    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='funding' AND column_name='amount_approved'`
    );
    const hasAmountApproved = colCheck.rows.length > 0;

    let result;
    if (hasAmountApproved) {
      // If no approved amount specified, default to the requested amount
      if (approvedAmount === null) {
        const fundingCheck = await pool.query('SELECT amount FROM funding WHERE id = $1', [id]);
        if (fundingCheck.rows.length > 0) {
          approvedAmount = Number(fundingCheck.rows[0].amount);
        }
      }

      result = await pool.query(`
        UPDATE funding
        SET approval_status = 'approved',
            funding_status = 'approved',
            amount_approved = $1,
            approved_by = $2,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [approvedAmount, req.user.id, id]);
    } else {
      result = await pool.query(`
        UPDATE funding
        SET approval_status = 'approved',
            funding_status = 'approved',
            approved_by = $1,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [req.user.id, id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding application not found' });
    }

    // Notify funding applicant
    const funding = result.rows[0];
    await createNotification(
      funding.user_id,
      'Funding Approved',
      `Your funding application "${funding.title}" has been approved.`,
      'success',
      '/funding'
    );

    res.json({
      message: 'Funding approved successfully',
      funding: result.rows[0],
      comments: comments
    });
  })
);

/**
 * PUT /api/admin/funding/:id/reject
 * Reject funding application
 * Access: admin, superAdmin
 */
router.put('/funding/:id/reject',
  authenticateToken,
  checkRole(['admin', 'superAdmin', 'ipManager']),
  checkPermission('funding', 'reject'),
  auditLog('funding'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await pool.query(`
      UPDATE funding
      SET approval_status = 'rejected',
          rejection_reason = $1,
          approved_by = $2,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [reason, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding application not found' });
    }

    // Notify funding applicant
    const funding = result.rows[0];
    await createNotification(
      funding.user_id,
      'Funding Application Rejected',
      `Your funding application "${funding.title}" has been rejected. Reason: ${reason}`,
      'warning',
      '/funding'
    );

    res.json({
      message: 'Funding application rejected',
      funding: result.rows[0]
    });
  })
);

/**
 * POST /api/admin/funding/:id/pledge
 * Record an investor pledge for a funding application
 * Access: Any authenticated user (investors, innovators, admins)
 */
router.post('/funding/:id/pledge',
  authenticateToken,
  auditLog('funding'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid pledge amount is required' });
    }

    // Check if funding application exists and is approved
    const fundingCheck = await pool.query(
      'SELECT id, title, amount, user_id, approval_status FROM funding WHERE id = $1',
      [id]
    );

    if (fundingCheck.rows.length > 0 && fundingCheck.rows[0].approval_status !== 'approved') {
      return res.status(400).json({ error: 'You can only pledge on approved projects' });
    }

    if (fundingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Funding application not found' });
    }

    const funding = fundingCheck.rows[0];

    // Create pledges table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS funding_pledges (
        id SERIAL PRIMARY KEY,
        funding_id INTEGER NOT NULL REFERENCES funding(id) ON DELETE CASCADE,
        pledger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        note TEXT,
        status VARCHAR(50) DEFAULT 'pledged' CHECK (status IN ('pledged', 'withdrawn', 'fulfilled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert the pledge
    const result = await pool.query(`
      INSERT INTO funding_pledges (funding_id, pledger_id, amount, note)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, req.user.id, amount, note || null]);

    // Get total pledged amount for this funding
    const totalPledged = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_pledged
      FROM funding_pledges
      WHERE funding_id = $1 AND status = 'pledged'
    `, [id]);

    res.status(201).json({
      message: 'Pledge recorded successfully',
      pledge: result.rows[0],
      funding: {
        id: funding.id,
        title: funding.title,
        requested_amount: funding.amount,
        total_pledged: parseFloat(totalPledged.rows[0].total_pledged)
      }
    });
  })
);

// ============================================
// EVENT MANAGEMENT
// ============================================

/**
 * GET /api/admin/events
 * Get all events
 * Access: admin, superAdmin
 */
router.get('/events',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT e.*, creator.name as created_by_name
      FROM events e
      LEFT JOIN users creator ON e.created_by = creator.id
      ORDER BY e.event_date DESC
    `);

    res.json(result.rows);
  })
);

/**
 * POST /api/admin/events
 * Create new event
 * Access: admin, superAdmin
 */
router.post('/events',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'create'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const { title, description, event_date, location, image_url } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const result = await pool.query(`
      INSERT INTO events (title, description, event_date, location, image_url, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [title, description, event_date, location, image_url, req.user.id]);

    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });
  })
);

/**
 * PUT /api/admin/events/:id
 * Update event
 * Access: admin, superAdmin
 */
router.put('/events/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'update'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, event_date, location, image_url } = req.body;

    const result = await pool.query(`
      UPDATE events
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          event_date = COALESCE($3, event_date),
          location = COALESCE($4, location),
          image_url = COALESCE($5, image_url),
          updated_by = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [title, description, event_date, location, image_url, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event: result.rows[0]
    });
  })
);

/**
 * DELETE /api/admin/events/:id
 * Delete event
 * Access: admin, superAdmin
 */
router.delete('/events/:id',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  checkPermission('events', 'delete'),
  auditLog('events'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING title', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event deleted successfully',
      eventTitle: result.rows[0].title
    });
  })
);

// ============================================
// AUDIT LOGS
// ============================================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 * Access: admin, superAdmin
 */
router.get('/audit-logs',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const { user_id, resource, action, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
    }

    if (resource) {
      params.push(resource);
      query += ` AND resource = $${params.length}`;
    }

    if (action) {
      params.push(`%${action}%`);
      query += ` AND action ILIKE $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');

    res.json({
      logs: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(countResult.rows[0].count)
      }
    });
  })
);

module.exports = router;
