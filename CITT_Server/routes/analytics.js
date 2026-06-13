/**
 * Analytics Routes
 * Purpose: Dashboard statistics for SuperAdmin and Admin
 * Provides data for charts and dashboard widgets
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard statistics
 * Access: admin, superAdmin
 */
router.get('/dashboard',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    // Helper to safely run a query and return defaults on failure (missing table etc.)
    const safeQuery = async (queryFn, fallback) => {
      try { return await queryFn(); } catch { return fallback; }
    };

    // Execute all queries in parallel for better performance
    const [
      usersStats,
      projectsStats,
      fundingStats,
      ipStats,
      eventsStats,
      recentActivity
    ] = await Promise.all([
      // User statistics
      safeQuery(() => pool.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'innovator' THEN 1 END) as innovators,
          COUNT(CASE WHEN role = 'ipManager' THEN 1 END) as ip_managers,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN role = 'superAdmin' THEN 1 END) as super_admins,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM users
      `), { rows: [{ total_users: 0, innovators: 0, ip_managers: 0, admins: 0, super_admins: 0, new_this_week: 0, new_this_month: 0 }] }),

      // Project statistics
      safeQuery(() => pool.query(`
        SELECT
          COUNT(*) as total_projects,
          COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_approval,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN project_status = 'submitted' THEN 1 END) as submitted,
          COUNT(CASE WHEN project_status = 'on_progress' THEN 1 END) as on_progress,
          COUNT(CASE WHEN project_status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM projects
      `), { rows: [{ total_projects: 0, pending_approval: 0, approved: 0, rejected: 0, submitted: 0, on_progress: 0, completed: 0, new_this_week: 0, new_this_month: 0 }] }),

      // Funding statistics
      safeQuery(() => pool.query(`
        SELECT
          COUNT(*) as total_applications,
          COALESCE(SUM(amount), 0) as total_amount_requested,
          COALESCE(SUM(CASE WHEN approval_status = 'approved' THEN amount ELSE 0 END), 0) as total_amount_approved,
          COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_approval,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN funding_status = 'applied' THEN 1 END) as applied,
          COUNT(CASE WHEN funding_status = 'on_progress' THEN 1 END) as on_progress,
          COUNT(CASE WHEN funding_status = 'approved' THEN 1 END) as funding_approved,
          COUNT(CASE WHEN funding_status = 'disbursed' THEN 1 END) as disbursed,
          COUNT(CASE WHEN funding_status = 'completed' THEN 1 END) as completed
        FROM funding
      `), { rows: [{ total_applications: 0, total_amount_requested: 0, total_amount_approved: 0, pending_approval: 0, approved: 0, rejected: 0, applied: 0, on_progress: 0, funding_approved: 0, disbursed: 0, completed: 0 }] }),

      // IP Management statistics
      safeQuery(() => pool.query(`
        SELECT
          COUNT(*) as total_ip_records,
          COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_approval,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM ip_management
      `), { rows: [{ total_ip_records: 0, pending_approval: 0, approved: 0, rejected: 0, new_this_week: 0, new_this_month: 0 }] }),

      // Events statistics
      safeQuery(() => pool.query(`
        SELECT
          COUNT(*) as total_events,
          COUNT(CASE WHEN start_date >= NOW() THEN 1 END) as upcoming_events,
          COUNT(CASE WHEN start_date < NOW() THEN 1 END) as past_events,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as created_this_month
        FROM events
      `), { rows: [{ total_events: 0, upcoming_events: 0, past_events: 0, created_this_month: 0 }] }),

      // Recent activity
      safeQuery(() => pool.query(`
        SELECT
          COUNT(*) as total_actions,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24_hours,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days
        FROM audit_logs
      `), { rows: [{ total_actions: 0, last_24_hours: 0, last_7_days: 0 }] })
    ]);

    res.json({
      users: usersStats.rows[0],
      projects: projectsStats.rows[0],
      funding: fundingStats.rows[0],
      ipManagement: ipStats.rows[0],
      events: eventsStats.rows[0],
      activity: recentActivity.rows[0],
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/analytics/projects-by-status
 * Get projects grouped by status for charts
 * Access: admin, superAdmin
 */
router.get('/projects-by-status',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT
        project_status,
        approval_status,
        COUNT(*) as count
      FROM projects
      GROUP BY project_status, approval_status
      ORDER BY project_status, approval_status
    `);

    res.json(result.rows);
  })
);

/**
 * GET /api/analytics/funding-by-status
 * Get funding grouped by status for charts
 * Access: admin, superAdmin
 */
router.get('/funding-by-status',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT
        funding_status,
        approval_status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM funding
      GROUP BY funding_status, approval_status
      ORDER BY funding_status, approval_status
    `);

    res.json(result.rows);
  })
);

/**
 * GET /api/analytics/recent-projects
 * Get recent project submissions
 * Access: admin, superAdmin
 */
router.get('/recent-projects',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.project_status,
        p.approval_status,
        p.created_at,
        u.name as user_name,
        u.email as user_email
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  })
);

/**
 * GET /api/analytics/users-by-role
 * Get user distribution by role for pie charts
 * Access: admin, superAdmin
 */
router.get('/users-by-role',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const result = await pool.query(`
      SELECT
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY
        CASE role
          WHEN 'superAdmin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'ipManager' THEN 3
          WHEN 'innovator' THEN 4
        END
    `);

    res.json(result.rows);
  })
);

/**
 * GET /api/analytics/activity-timeline
 * Get activity timeline for the past 7 days
 * Access: admin, superAdmin
 */
router.get('/activity-timeline',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 7;

    const result = await pool.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count
      FROM audit_logs
      WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);

    res.json(result.rows);
  })
);

/**
 * GET /api/analytics/top-users
 * Get most active users
 * Access: admin, superAdmin
 */
router.get('/top-users',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(p.id) as project_count,
        COUNT(f.id) as funding_count,
        COUNT(ip.id) as ip_count
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      LEFT JOIN funding f ON u.id = f.user_id
      LEFT JOIN ip_management ip ON u.id = ip.user_id
      WHERE u.role = 'innovator'
      GROUP BY u.id, u.name, u.email, u.role
      HAVING COUNT(p.id) > 0 OR COUNT(f.id) > 0 OR COUNT(ip.id) > 0
      ORDER BY (COUNT(p.id) + COUNT(f.id) + COUNT(ip.id)) DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  })
);

/**
 * GET /api/analytics/pending-approvals
 * Get all pending approvals summary
 * Access: admin, superAdmin
 */
router.get('/pending-approvals',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const safeQuery = async (queryFn, fallback) => {
      try { return await queryFn(); } catch { return fallback; }
    };

    const [projects, funding, ip] = await Promise.all([
      safeQuery(() => pool.query(`SELECT COUNT(*) as count FROM projects WHERE approval_status = 'pending'`), { rows: [{ count: 0 }] }),
      safeQuery(() => pool.query(`SELECT COUNT(*) as count FROM funding WHERE approval_status = 'pending'`), { rows: [{ count: 0 }] }),
      safeQuery(() => pool.query(`SELECT COUNT(*) as count FROM ip_management WHERE approval_status = 'pending'`), { rows: [{ count: 0 }] })
    ]);

    res.json({
      projects: parseInt(projects.rows[0].count),
      funding: parseInt(funding.rows[0].count),
      ipManagement: parseInt(ip.rows[0].count),
      total: parseInt(projects.rows[0].count) +
             parseInt(funding.rows[0].count) +
             parseInt(ip.rows[0].count)
    });
  })
);

/**
 * GET /api/analytics/monthly-trends
 * Get monthly trends for projects, funding, IP
 * Access: admin, superAdmin
 */
router.get('/monthly-trends',
  authenticateToken,
  checkRole(['admin', 'superAdmin']),
  asyncHandler(async (req, res) => {
    const months = parseInt(req.query.months) || 6;

    const result = await pool.query(`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', NOW() - ($1 || ' months')::INTERVAL),
          DATE_TRUNC('month', NOW()),
          '1 month'::interval
        ) AS month
      )
      SELECT
        TO_CHAR(m.month, 'YYYY-MM') as month,
        COUNT(DISTINCT p.id) as projects,
        COUNT(DISTINCT f.id) as funding_applications,
        COUNT(DISTINCT ip.id) as ip_records,
        COUNT(DISTINCT u.id) as new_users
      FROM months m
      LEFT JOIN projects p ON DATE_TRUNC('month', p.created_at) = m.month
      LEFT JOIN funding f ON DATE_TRUNC('month', f.created_at) = m.month
      LEFT JOIN ip_management ip ON DATE_TRUNC('month', ip.created_at) = m.month
      LEFT JOIN users u ON DATE_TRUNC('month', u.created_at) = m.month
      GROUP BY m.month
      ORDER BY m.month DESC
    `, [months]);

    res.json(result.rows);
  })
);

module.exports = router;
