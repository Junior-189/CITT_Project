/**
 * Role-Based Authorization Middleware
 * Purpose: Restrict route access based on user roles
 */

const pool = require('../config/database');

/**
 * Check if user has one of the required roles
 *
 * Usage:
 * router.get('/admin/users',
 *   authenticateToken,
 *   checkRole(['admin', 'superAdmin']),
 *   getAllUsers
 * );
 *
 * @param {Array<string>} allowedRoles - Array of roles that can access this route
 * @returns {Function} Express middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Ensure user has a role
    if (!req.user.role) {
      return res.status(403).json({
        error: 'No role assigned to user',
        code: 'NO_ROLE',
        message: 'Your account does not have a role assigned. Please contact an administrator.'
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Access denied: User ${req.user.email} (${req.user.role}) attempted to access route requiring ${allowedRoles.join(' or ')}`);

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }

    // Role is valid, proceed to next middleware
    console.log(`✅ Access granted: User ${req.user.email} (${req.user.role}) accessing protected route`);
    next();
  };
};

/**
 * Check if user has specific permission for a resource:action
 * This checks the role_permissions table for granular permissions
 *
 * Usage:
 * router.put('/projects/:id/approve',
 *   authenticateToken,
 *   checkPermission('projects', 'approve'),
 *   approveProject
 * );
 *
 * @param {string} resource - The resource being accessed (e.g., 'projects', 'funding')
 * @param {string} action - The action being performed (e.g., 'approve', 'delete')
 * @returns {Function} Express middleware function
 */
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // SuperAdmin has all permissions
    if (req.user.role === 'superAdmin') {
      console.log(`✅ SuperAdmin access granted: ${req.user.email} → ${resource}:${action}`);
      return next();
    }

    try {
      // Check if user's role has this specific permission
      const result = await pool.query(
        `SELECT * FROM role_permissions
         WHERE role = $1 AND resource = $2 AND action = $3`,
        [req.user.role, resource, action]
      );

      if (result.rows.length === 0) {
        console.log(`❌ Permission denied: ${req.user.email} (${req.user.role}) → ${resource}:${action}`);

        return res.status(403).json({
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          message: `Your role (${req.user.role}) does not have permission to ${action} ${resource}`,
          required: { resource, action },
          userRole: req.user.role
        });
      }

      // Permission found, allow access
      console.log(`✅ Permission granted: ${req.user.email} (${req.user.role}) → ${resource}:${action}`);
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

/**
 * Check if user owns the resource they're trying to access
 * Useful for endpoints where users can only access their own data
 *
 * Usage:
 * router.put('/projects/:id',
 *   authenticateToken,
 *   checkOwnership('projects', 'user_id'),
 *   updateProject
 * );
 *
 * @param {string} tableName - Database table name
 * @param {string} ownerColumn - Column name that stores the user ID (default: 'user_id')
 * @returns {Function} Express middleware function
 */
const checkOwnership = (tableName, ownerColumn = 'user_id') => {
  return async (req, res, next) => {
    // SuperAdmin and Admin can access everything
    if (req.user.role === 'superAdmin' || req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params.id;

    if (!resourceId) {
      return res.status(400).json({
        error: 'Resource ID required',
        code: 'NO_RESOURCE_ID'
      });
    }

    try {
      const result = await pool.query(
        `SELECT ${ownerColumn} FROM ${tableName} WHERE id = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Resource not found',
          code: 'NOT_FOUND'
        });
      }

      const ownerId = result.rows[0][ownerColumn];

      if (ownerId !== req.user.id) {
        console.log(`❌ Ownership denied: User ${req.user.id} attempted to access resource owned by user ${ownerId}`);

        return res.status(403).json({
          error: 'You can only access your own resources',
          code: 'NOT_OWNER'
        });
      }

      // User owns the resource
      console.log(`✅ Ownership verified: User ${req.user.id} owns resource ${resourceId}`);
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Ownership check failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

/**
 * Check if user can modify another user's role
 * Only superAdmin can promote/demote users
 *
 * Usage:
 * router.put('/users/:id/role',
 *   authenticateToken,
 *   canModifyRole,
 *   changeUserRole
 * );
 */
const canModifyRole = (req, res, next) => {
  if (req.user.role !== 'superAdmin') {
    return res.status(403).json({
      error: 'Only superAdmin can modify user roles',
      code: 'FORBIDDEN',
      requiredRole: 'superAdmin',
      userRole: req.user.role
    });
  }

  // Prevent superAdmin from demoting themselves
  const targetUserId = parseInt(req.params.id);
  if (targetUserId === req.user.id) {
    return res.status(400).json({
      error: 'You cannot change your own role',
      code: 'CANNOT_SELF_MODIFY'
    });
  }

  next();
};

module.exports = {
  checkRole,
  checkPermission,
  checkOwnership,
  canModifyRole
};
