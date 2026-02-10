const pool = require('../config/database');

async function createNotification(userId, title, message, type, link) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, title, message, type || 'info', link || null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

async function notifyByRole(role, title, message, type, link) {
  try {
    const users = await pool.query(
      `SELECT id FROM users WHERE role = $1 AND deleted_at IS NULL`,
      [role]
    );
    for (const user of users.rows) {
      await createNotification(user.id, title, message, type, link);
    }
  } catch (err) {
    console.error(`Failed to notify ${role}s:`, err.message);
  }
}

async function notifyAdmins(title, message, type, link) {
  try {
    const admins = await pool.query(
      `SELECT id FROM users WHERE role IN ('admin', 'superAdmin') AND deleted_at IS NULL`
    );
    for (const admin of admins.rows) {
      await createNotification(admin.id, title, message, type, link);
    }
  } catch (err) {
    console.error('Failed to notify admins:', err.message);
  }
}

module.exports = {
  createNotification,
  notifyByRole,
  notifyAdmins,
};
