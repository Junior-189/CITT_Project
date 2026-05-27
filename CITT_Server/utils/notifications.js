const pool = require('../config/database');

const createNotification = async (userId, title, message, type = 'general', link = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link, read, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
      [userId, title, message, type, link]
    );
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

async function notifyByRole(role, title, message, type, link) {
  try {
    const users = await pool.query(
      `SELECT id FROM users WHERE role = $1 AND deleted_at IS NULL AND account_status = 'approved'`,
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
      `SELECT id FROM users WHERE role IN ('admin', 'superAdmin') AND deleted_at IS NULL AND account_status = 'approved'`
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
