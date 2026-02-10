/**
 * Super Admin Routes
 * Purpose: SuperAdmin-only functionality (user promotion, system management)
 * Access: superAdmin role ONLY
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { canModifyRole } = require('../middleware/roleAuth');
const { auditLog, logAction } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcrypt');
const { ROLES, isValidRole } = require('../config/roles');

/**
 * GET /api/superadmin/users
 * Get all users with their roles (superAdmin view)
 * Access: superAdmin only
 */
router.get('/users',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const { role } = req.query;

    let baseQuery = `
      SELECT id, name, email, phone, role, university, college,
             year_of_study, profile_complete, created_at, updated_at
      FROM users
      WHERE deleted_at IS NULL
    `;

    const params = [];

    if (role) {
      params.push(role);
      baseQuery += ` AND role = $${params.length}`;
    }

    baseQuery += ` ORDER BY
        CASE role
          WHEN 'superAdmin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'ipManager' THEN 3
          WHEN 'innovator' THEN 4
        END,
        created_at DESC`;

    const result = await pool.query(baseQuery, params);

    res.json(result.rows);
  })
);

/**
 * PUT /api/superadmin/users/:id/role
 * Change user's role (promote/demote)
 * Access: superAdmin only
 */
router.put('/users/:id/role',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newRole } = req.body;

    // Validate role
    if (!newRole || !isValidRole(newRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles: Object.values(ROLES)
      });
    }

    // Prevent changing your own role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        error: 'You cannot change your own role'
      });
    }

    // Get current user info
    const currentUser = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or deleted' });
    }

    const oldRole = currentUser.rows[0].role;

    // Update role
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newRole, id]
    );

    // Log the role change
    await logAction(
      { user: req.user, method: 'PUT', path: `/superadmin/users/${id}/role`, params: { id } },
      'CHANGE_USER_ROLE',
      'users',
      parseInt(id)
    );

    res.json({
      message: `User role changed from ${oldRole} to ${newRole}`,
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        oldRole: oldRole,
        newRole: result.rows[0].role
      }
    });
  })
);

/**
 * POST /api/superadmin/users/:id/promote-to-admin
 * Quick action to promote user to admin
 * Access: superAdmin only
 */
router.post('/users/:id/promote-to-admin',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent promoting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        error: 'You cannot promote yourself'
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role',
      [ROLES.ADMIN, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `${result.rows[0].name} has been promoted to Admin`,
      user: result.rows[0]
    });
  })
);

/**
 * POST /api/superadmin/users/:id/demote-to-innovator
 * Quick action to demote user to innovator
 * Access: superAdmin only
 */
router.post('/users/:id/demote-to-innovator',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent demoting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        error: 'You cannot demote yourself'
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role',
      [ROLES.INNOVATOR, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `${result.rows[0].name} has been demoted to Innovator`,
      user: result.rows[0]
    });
  })
);

/**
 * GET /api/superadmin/system/stats
 * Get comprehensive system statistics
 * Access: superAdmin only
 */
router.get('/system/stats',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const [
      users,
      projects,
      funding,
      ip,
      events,
      auditLogs,
      permissions
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM projects'),
      pool.query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount FROM funding'),
      pool.query('SELECT COUNT(*) as count FROM ip_management'),
      pool.query('SELECT COUNT(*) as count FROM events'),
      pool.query('SELECT COUNT(*) as count FROM audit_logs'),
      pool.query('SELECT COUNT(*) as count FROM role_permissions')
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      totalFundingApplications: parseInt(funding.rows[0].count),
      totalFundingAmount: parseFloat(funding.rows[0].total_amount),
      totalIPRecords: parseInt(ip.rows[0].count),
      totalEvents: parseInt(events.rows[0].count),
      totalAuditLogs: parseInt(auditLogs.rows[0].count),
      totalPermissions: parseInt(permissions.rows[0].count),
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/superadmin/permissions
 * Get all permissions by role
 * Access: superAdmin only
 */
router.get('/permissions',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT role, resource, action, description
      FROM role_permissions
      ORDER BY
        CASE role
          WHEN 'superAdmin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'ipManager' THEN 3
          WHEN 'innovator' THEN 4
        END,
        resource,
        action
    `);

    // Group by role
    const permissionsByRole = result.rows.reduce((acc, perm) => {
      if (!acc[perm.role]) {
        acc[perm.role] = [];
      }
      acc[perm.role].push({
        resource: perm.resource,
        action: perm.action,
        description: perm.description
      });
      return acc;
    }, {});

    res.json(permissionsByRole);
  })
);

/**
 * POST /api/superadmin/permissions
 * Add a new permission (advanced feature)
 * Access: superAdmin only
 */
router.post('/permissions',
  authenticateToken,
  canModifyRole,
  auditLog('permissions'),
  asyncHandler(async (req, res) => {
    const { role, resource, action, description } = req.body;

    if (!role || !resource || !action) {
      return res.status(400).json({
        error: 'Role, resource, and action are required'
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles: Object.values(ROLES)
      });
    }

    try {
      const result = await pool.query(`
        INSERT INTO role_permissions (role, resource, action, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [role, resource, action, description]);

      res.status(201).json({
        message: 'Permission added successfully',
        permission: result.rows[0]
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          error: 'This permission already exists'
        });
      }
      throw error;
    }
  })
);

/**
 * DELETE /api/superadmin/permissions/:id
 * Delete a permission (advanced feature)
 * Access: superAdmin only
 */
router.delete('/permissions/:id',
  authenticateToken,
  canModifyRole,
  auditLog('permissions'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM role_permissions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json({
      message: 'Permission deleted successfully',
      deletedPermission: result.rows[0]
    });
  })
);

/**
 * GET /api/superadmin/audit-logs/all
 * Get all audit logs (no filters, superAdmin only)
 * Access: superAdmin only
 */
router.get('/audit-logs/all',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

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

/**
 * DELETE /api/superadmin/audit-logs/cleanup
 * Delete old audit logs (older than specified days)
 * Access: superAdmin only
 */
router.delete('/audit-logs/cleanup',
  authenticateToken,
  canModifyRole,
  auditLog('audit_logs'),
  asyncHandler(async (req, res) => {
    const { days = 90 } = req.query; // Default: delete logs older than 90 days

    const result = await pool.query(`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '${parseInt(days)} days'
      RETURNING COUNT(*) as deleted_count
    `);

    res.json({
      message: `Deleted audit logs older than ${days} days`,
      deletedCount: result.rowCount
    });
  })
);

/**
 * GET /api/superadmin/analytics
 * Get analytics data (user, project, funding stats)
 * Access: superAdmin only
 */
router.get('/analytics',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const [
      users,
      projects,
      funding
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN role = 'superAdmin' THEN 1 ELSE 0 END) as super_admins,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN role = 'ipManager' THEN 1 ELSE 0 END) as ip_managers,
          SUM(CASE WHEN role = 'innovator' THEN 1 ELSE 0 END) as innovators
        FROM users
        WHERE deleted_at IS NULL
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approval,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM projects
        WHERE deleted_at IS NULL
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(amount), 0) as total_amount,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approval,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM funding
        WHERE deleted_at IS NULL
      `)
    ]);

    res.json({
      users: users.rows[0],
      projects: projects.rows[0],
      funding: funding.rows[0],
      overview: {
        totalUsers: parseInt(users.rows[0].total),
        totalProjects: parseInt(projects.rows[0].total),
        totalFunding: parseInt(funding.rows[0].total)
      }
    });
  })
);

/**
 * GET /api/superadmin/database/info
 * Get database information with all table details
 * Access: superAdmin only
 */
router.get('/database/info',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    // Get all tables info
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Get database size
    const sizeResult = await pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as database_size`);

    // Get row counts for each table
    const tables = await Promise.all(
      tablesResult.rows.map(async (table) => {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
          const columnsResult = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [table.table_name]);

          const count = parseInt(countResult.rows[0].count);
          return {
            name: table.table_name,
            record_count: count,
            rowCount: count,
            columns: columnsResult.rows
          };
        } catch (error) {
          return {
            name: table.table_name,
            record_count: 0,
            rowCount: 0,
            columns: [],
            error: error.message
          };
        }
      })
    );

    const overview = {
      total_tables: tables.length,
      total_records: tables.reduce((sum, t) => sum + t.record_count, 0),
      database_size: sizeResult.rows[0]?.database_size || 'N/A'
    };

    res.json({ tables, overview });
  })
);

/**
 * GET /api/superadmin/database/tables
 * Get information about all database tables
 * Access: superAdmin only
 */
router.get('/database/tables',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Get row counts for each table
    const tables = await Promise.all(
      result.rows.map(async (table) => {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
          return {
            name: table.table_name,
            columnCount: parseInt(table.column_count),
            rowCount: parseInt(countResult.rows[0].count)
          };
        } catch (error) {
          return {
            name: table.table_name,
            columnCount: parseInt(table.column_count),
            rowCount: 0,
            error: 'Could not count rows'
          };
        }
      })
    );

    res.json({ tables });
  })
);

/**
 * POST /api/superadmin/users/bulk-update-role
 * Bulk update roles for multiple users
 * Access: superAdmin only
 */
router.post('/users/bulk-update-role',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { userIds, newRole } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    if (!newRole || !isValidRole(newRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles: Object.values(ROLES)
      });
    }

    // Prevent updating your own role
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({
        error: 'Cannot include your own ID in bulk update'
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = ANY($2::int[]) AND deleted_at IS NULL RETURNING id, name, email, role',
      [newRole, userIds]
    );

    res.json({
      message: `Updated ${result.rows.length} users to role: ${newRole}`,
      updatedUsers: result.rows
    });
  })
);

/**
 * DELETE /api/superadmin/users/:id
 * Soft delete a user (marks as deleted, can be restored later)
 * Access: superAdmin only
 */
router.delete('/users/:id',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const userCheck = await pool.query('SELECT role, name, email FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or already deleted' });
    }

    // Cannot delete yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Soft delete: Set deleted_at and deleted_by
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

/**
 * GET /api/superadmin/users/deleted
 * Get all soft-deleted users
 * Access: superAdmin only
 */
router.get('/users/deleted',
  authenticateToken,
  canModifyRole,
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.university, u.college,
             u.year_of_study, u.profile_complete, u.created_at, u.updated_at,
             u.deleted_at, u.deleted_by,
             deleter.name as deleted_by_name
      FROM users u
      LEFT JOIN users deleter ON u.deleted_by = deleter.id
      WHERE u.deleted_at IS NOT NULL
      ORDER BY u.deleted_at DESC
    `);

    res.json({
      users: result.rows,
      total: result.rows.length
    });
  })
);

/**
 * POST /api/superadmin/users/:id/restore
 * Restore a soft-deleted user
 * Access: superAdmin only
 */
router.post('/users/:id/restore',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists and is deleted
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NOT NULL', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Deleted user not found' });
    }

    // Restore user: Clear deleted_at and deleted_by
    const result = await pool.query(
      `UPDATE users
       SET deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role`,
      [id]
    );

    res.json({
      message: `User ${result.rows[0].name} has been restored successfully`,
      user: result.rows[0]
    });
  })
);

/**
 * DELETE /api/superadmin/users/:id/permanent
 * Permanently delete a user (cannot be undone)
 * Access: superAdmin only
 */
router.delete('/users/:id/permanent',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists and is already soft-deleted
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NOT NULL', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Deleted user not found. Users must be soft-deleted first.' });
    }

    // Cannot permanently delete yourself (though you shouldn't be soft-deleted anyway)
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot permanently delete your own account' });
    }

    // Permanently delete the user
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING email, name', [id]);

    res.json({
      message: `User ${result.rows[0].name} has been permanently deleted`,
      deletedUser: result.rows[0]
    });
  })
);

/**
 * PUT /api/superadmin/users/:id
 * Update user information (superAdmin can update any user)
 * Access: superAdmin only
 */
router.put('/users/:id',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role`,
      [name, email, id]
    );

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  })
);

/**
 * PUT /api/superadmin/users/:id/password
 * Change user password (superAdmin can change any user's password)
 * Access: superAdmin only
 */
router.put('/users/:id/password',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `UPDATE users
       SET password = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email`,
      [hashedPassword, id]
    );

    res.json({
      message: `Password updated successfully for ${result.rows[0].name}`,
      user: result.rows[0]
    });
  })
);

/**
 * POST /api/superadmin/users
 * Create a new user (admin or ipManager) by superAdmin
 * Access: superAdmin only
 */
router.post('/users',
  authenticateToken,
  canModifyRole,
  auditLog('users'),
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, university } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid role', validRoles: Object.values(ROLES) });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, university, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, phone, role, university, created_at`,
      [name, email, hashedPassword, phone || null, role, university || null]
    );

    res.status(201).json({
      message: `${result.rows[0].name} created as ${role} successfully`,
      user: result.rows[0]
    });
  })
);

module.exports = router;
