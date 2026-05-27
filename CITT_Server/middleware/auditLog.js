const pool = require('../config/database');

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() ||
  req.headers['x-real-ip'] ||
  req.connection?.remoteAddress ||
  req.socket?.remoteAddress ||
  null;

const sanitizeBody = (body) => {
  if (!body) return null;
  const sanitized = { ...body };
  ['password', 'token', 'secret', 'apiKey', 'api_key'].forEach(f => {
    if (sanitized[f]) sanitized[f] = '***REDACTED***';
  });
  return sanitized;
};

const auditLog = (resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    setImmediate(async () => {
      try {
        await pool.query(
          `INSERT INTO audit_logs (user_id, user_email, user_role, action, resource, resource_id, details, ip_address, user_agent, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'success',NOW())`,
          [
            req.user?.id || null,
            req.user?.email || null,
            req.user?.role || null,
            `${req.method} ${req.path}`,
            resource || 'general',
            req.params?.id ? parseInt(req.params.id) : null,
            JSON.stringify(sanitizeBody(req.body)),
            getClientIp(req),
            req.get('User-Agent') || null,
          ]
        );
      } catch (err) { /* silent — never block the request */ }
    });
    return originalJson(data);
  };
  next();
};

const logAction = async (userId, action, resource, resourceId, details) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, status, created_at)
       VALUES ($1,$2,$3,$4,$5,'success',NOW())`,
      [userId || null, action, resource || null, resourceId || null,
       details ? JSON.stringify(details) : null]
    );
  } catch (err) { /* silent */ }
};

const logActivity = async (logData) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, user_email, user_role, action, resource, resource_id, details, ip_address, user_agent, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
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
        logData.status || 'success',
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

const logFailure = async (req, action, resource = null, resourceId = null, reason = null) => {
  await logActivity({
    user_id: req.user ? req.user.id : null,
    user_email: req.user ? req.user.email : null,
    user_role: req.user ? req.user.role : null,
    action,
    resource,
    resource_id: resourceId,
    details: { method: req.method, path: req.path, reason, params: req.params },
    ip_address: getClientIp(req),
    user_agent: req.headers['user-agent'] || null,
    status: 'failure',
  });
};

module.exports = { auditLog, logAction, logActivity, logFailure };
