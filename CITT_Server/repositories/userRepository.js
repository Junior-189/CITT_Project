const pool = require('../config/database');

const userRepository = {
  findById: async (id) => {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, university, campus, college, year_of_study,
              profile_complete, firestore_id, profile_photo_url, account_status,
              created_at, updated_at
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0] || null;
  },

  findByFirestoreId: async (firestoreId) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE firestore_id = $1 AND deleted_at IS NULL',
      [firestoreId]
    );
    return result.rows[0] || null;
  },

  findByEmailOrFirestore: async (email, firestoreId) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE (email = $1 OR firestore_id = $2) AND deleted_at IS NULL',
      [email, firestoreId]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ page = 1, limit = 50, role, search } = {}) => {
    const offset = (page - 1) * limit;
    let query = `SELECT id, name, email, phone, role, university, campus, college, year_of_study,
                        profile_complete, account_status, created_at, updated_at
                 FROM users WHERE deleted_at IS NULL`;
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL${
        role ? ` AND role = $1` : ''
      }`,
      role ? [role] : []
    );

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  },

  create: async (userData) => {
    const { name, email, password, phone, role, university, campus, college,
            year_of_study, firestore_id, account_status = 'pending' } = userData;

    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, university, campus, college,
                          year_of_study, firestore_id, account_status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       RETURNING id, name, email, phone, role, university, campus, account_status, created_at`,
      [name, email, password || null, phone || null, role, university || null,
       campus || null, college || null, year_of_study || null, firestore_id || null,
       account_status]
    );
    return result.rows[0];
  },

  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, email, phone, role, university, college, year_of_study, profile_complete`,
      values
    );
    return result.rows[0] || null;
  },

  updatePassword: async (id, hashedPassword) => {
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
  },

  softDelete: async (id, deletedBy = null) => {
    const result = await pool.query(
      `UPDATE users SET deleted_at = NOW(), deleted_by = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL RETURNING id, email, name`,
      [deletedBy, id]
    );
    return result.rows[0] || null;
  },

  approveAccount: async (id, approvedBy) => {
    const result = await pool.query(
      `UPDATE users SET account_status = 'approved', approved_by_admin = $1,
              approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role, account_status`,
      [approvedBy, id]
    );
    return result.rows[0] || null;
  },

  rejectAccount: async (id, approvedBy, reason) => {
    const result = await pool.query(
      `UPDATE users SET account_status = 'rejected', approval_rejection_reason = $1,
              approved_by_admin = $2, approved_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, name, email, account_status`,
      [reason || 'Not specified', approvedBy, id]
    );
    return result.rows[0] || null;
  },

  updateRole: async (id, newRole) => {
    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role`,
      [newRole, id]
    );
    return result.rows[0] || null;
  },

  changePassword: async (id, currentPassword, newPassword) => {
    const bcrypt = require('bcrypt');
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return { success: false, error: 'User not found' };

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) return { success: false, error: 'Current password is incorrect' };

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, id]);
    return { success: true };
  },

  getPendingUsers: async () => {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, university, campus, created_at
       FROM users WHERE account_status = 'pending' AND deleted_at IS NULL ORDER BY created_at ASC`
    );
    return result.rows;
  },
};

module.exports = userRepository;
