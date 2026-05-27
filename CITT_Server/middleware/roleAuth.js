const pool = require('../config/database');
const { ADMIN_ROLES } = require('../config/roles');

const checkRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied', yourRole: req.user.role });
  next();
};

const checkAdminRole = () => checkRole(['admin','superAdmin','transferTechnologyOfficer']);
const checkReviewerRole = () => checkRole(['admin','superAdmin','transferTechnologyOfficer','diiDirector','debmDirector','rtpDirector','mentor','technicalCommittee','coordinator']);

// Supports both new single-arg style and legacy two-arg style (resource, action).
// When called with two args, defers to the checkRole already applied on the route.
const checkPermission = (permission, _action) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (ADMIN_ROLES.includes(req.user.role)) return next();
  if (_action !== undefined) return next(); // legacy two-arg call, role already validated by checkRole above
  return res.status(403).json({ error: 'Permission denied', required: permission });
};

const requireSelf = (paramName = 'id') => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (parseInt(req.user.id) === parseInt(req.params[paramName]) || ADMIN_ROLES.includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Access denied' });
};

// Preserved for superAdmin.js compatibility
const canModifyRole = (req, res, next) => {
  if (req.user.role !== 'superAdmin') {
    return res.status(403).json({
      error: 'Only superAdmin can modify user roles',
      code: 'FORBIDDEN',
      requiredRole: 'superAdmin',
      userRole: req.user.role
    });
  }
  const targetUserId = parseInt(req.params.id);
  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role', code: 'CANNOT_SELF_MODIFY' });
  }
  next();
};

// Preserved for backward compatibility
const checkOwnership = (tableName, ownerColumn = 'user_id') => {
  return async (req, res, next) => {
    if (req.user.role === 'superAdmin' || req.user.role === 'admin') return next();
    const resourceId = req.params.id;
    if (!resourceId) return res.status(400).json({ error: 'Resource ID required', code: 'NO_RESOURCE_ID' });
    try {
      const result = await pool.query(`SELECT ${ownerColumn} FROM ${tableName} WHERE id = $1`, [resourceId]);
      if (!result.rows.length) return res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      if (result.rows[0][ownerColumn] !== req.user.id) return res.status(403).json({ error: 'You can only access your own resources', code: 'NOT_OWNER' });
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Ownership check failed', code: 'OWNERSHIP_ERROR' });
    }
  };
};

module.exports = { checkRole, checkAdminRole, checkReviewerRole, checkPermission, requireSelf, canModifyRole, checkOwnership };
