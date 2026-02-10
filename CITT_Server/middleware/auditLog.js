/**
 * Audit Logging Middleware
 * Purpose: Track all important actions in the system for security and compliance
 */

const pool = require('../config/database');

/**
 * Log activity to audit_logs table
 * @param {Object} logData - Data to log
 */
const logActivity = async (logData) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, user_email, user_role, action, resource, resource_id, details, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        logData.user_id || null,
        logData.user_email || null,
        logData.user_role || null,
        logData.action,
        logData.resource || null,
        logData.resource_id || null,
        logData.details ? JSON.stringify(logData.details) : null,
        logData.ip_address || null,
        logData.user_agent || null,
        logData.status || 'success'
      ]
    );

    console.log(`📝 Audit log: ${logData.user_email || 'Anonymous'} → ${logData.action}`);
  } catch (error) {
    // Don't throw error - we don't want logging failures to break the app
    console.error('❌ Audit log error:', error.message);
  }
};

/**
 * Middleware to automatically log actions
 * Use this on routes that perform important actions
 *
 * Usage:
 * router.put('/projects/:id/approve',
 *   authenticateToken,
 *   checkRole(['admin', 'superAdmin']),
 *   auditLog('projects'),  // ← Logs the action
 *   approveProject
 * );
 *
 * @param {string} resource - The resource being acted upon (e.g., 'projects', 'users')
 * @returns {Function} Express middleware function
 */
const auditLog = (resource) => {
  return (req, res, next) => {
    // Capture original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Track if response was sent
    let responseSent = false;

    // Override res.json to log after successful response
    res.json = function (data) {
      if (!responseSent && res.statusCode < 400 && req.user) {
        responseSent = true;

        // Log the action
        logActivity({
          user_id: req.user.id,
          user_email: req.user.email,
          user_role: req.user.role,
          action: `${req.method} ${req.path}`,
          resource: resource,
          resource_id: req.params.id ? parseInt(req.params.id) : null,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            body: sanitizeBody(req.body),
            statusCode: res.statusCode
          },
          ip_address: getClientIp(req),
          user_agent: req.headers['user-agent'] || null,
          status: 'success'
        });
      }

      return originalJson.call(this, data);
    };

    // Override res.send as well (for cases where .send is used instead of .json)
    res.send = function (data) {
      if (!responseSent && res.statusCode < 400 && req.user) {
        responseSent = true;

        logActivity({
          user_id: req.user.id,
          user_email: req.user.email,
          user_role: req.user.role,
          action: `${req.method} ${req.path}`,
          resource: resource,
          resource_id: req.params.id ? parseInt(req.params.id) : null,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            statusCode: res.statusCode
          },
          ip_address: getClientIp(req),
          user_agent: req.headers['user-agent'] || null,
          status: 'success'
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Log a specific action immediately (not waiting for response)
 * Use this for actions that don't return a response or need immediate logging
 *
 * Usage:
 * logAction(req, 'USER_LOGIN', 'users', userId);
 *
 * @param {Object} req - Express request object
 * @param {string} action - Action description
 * @param {string} resource - Resource being acted upon
 * @param {number} resourceId - ID of the resource
 */
const logAction = async (req, action, resource = null, resourceId = null) => {
  if (!req.user) {
    return;
  }

  await logActivity({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: action,
    resource: resource,
    resource_id: resourceId,
    details: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query
    },
    ip_address: getClientIp(req),
    user_agent: req.headers['user-agent'] || null,
    status: 'success'
  });
};

/**
 * Log a failed action
 *
 * Usage:
 * logFailure(req, 'APPROVE_PROJECT_FAILED', 'projects', projectId, 'Insufficient permissions');
 *
 * @param {Object} req - Express request object
 * @param {string} action - Action description
 * @param {string} resource - Resource being acted upon
 * @param {number} resourceId - ID of the resource
 * @param {string} reason - Reason for failure
 */
const logFailure = async (req, action, resource = null, resourceId = null, reason = null) => {
  await logActivity({
    user_id: req.user ? req.user.id : null,
    user_email: req.user ? req.user.email : null,
    user_role: req.user ? req.user.role : null,
    action: action,
    resource: resource,
    resource_id: resourceId,
    details: {
      method: req.method,
      path: req.path,
      reason: reason,
      params: req.params,
      query: req.query
    },
    ip_address: getClientIp(req),
    user_agent: req.headers['user-agent'] || null,
    status: 'failure'
  });
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
};

/**
 * Remove sensitive data from request body before logging
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeBody = (body) => {
  if (!body) return null;

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

module.exports = {
  auditLog,
  logAction,
  logFailure,
  logActivity
};
