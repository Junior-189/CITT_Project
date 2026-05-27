const pool = require('../config/database');

const fundingRepository = {
  findById: async (id) => {
    const result = await pool.query(
      `SELECT f.*, u.name as user_name, u.email as user_email,
              approver.name as approved_by_name, p.title as project_title
       FROM funding f
       JOIN users u ON f.user_id = u.id
       LEFT JOIN users approver ON f.approved_by = approver.id
       LEFT JOIN projects p ON f.project_id = p.id
       WHERE f.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ userId, approvalStatus, fundingStatus, isReviewer = false, page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT f.*, u.name as user_name, u.email as user_email,
             approver.name as approved_by_name, p.title as project_title
      FROM funding f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN users approver ON f.approved_by = approver.id
      LEFT JOIN projects p ON f.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (!isReviewer && userId) {
      params.push(userId);
      query += ` AND f.user_id = $${params.length}`;
    }
    if (approvalStatus) {
      params.push(approvalStatus);
      query += ` AND f.approval_status = $${params.length}`;
    }
    if (fundingStatus) {
      params.push(fundingStatus);
      query += ` AND f.funding_status = $${params.length}`;
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM funding f';
    const countParams = [];
    if (!isReviewer && userId) {
      countQuery += ' WHERE f.user_id = $1';
      countParams.push(userId);
    }
    const countResult = await pool.query(countQuery, countParams);

    return {
      funding: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  },

  create: async (data) => {
    const { userId, projectId, title, description, amount, currency = 'TZS', grantType = 'research' } = data;

    const result = await pool.query(
      `INSERT INTO funding (user_id, project_id, title, description, amount, currency, grant_type,
                            approval_status, funding_status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','applied',NOW(),NOW())
       RETURNING *`,
      [userId, projectId || null, title, description || null, amount, currency, grantType]
    );
    return result.rows[0];
  },

  approve: async (id, approvedBy, amountApproved, trx = null) => {
    const client = trx || pool;

    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='funding' AND column_name='amount_approved'`
    );
    const hasAmountApproved = colCheck.rows.length > 0;

    let result;
    if (hasAmountApproved) {
      result = await client.query(
        `UPDATE funding SET approval_status = 'approved', funding_status = 'approved',
                amount_approved = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [amountApproved, approvedBy, id]
      );
    } else {
      result = await client.query(
        `UPDATE funding SET approval_status = 'approved', funding_status = 'approved',
                approved_by = $1, approved_at = NOW(), updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [approvedBy, id]
      );
    }
    return result.rows[0] || null;
  },

  reject: async (id, approvedBy, reason, trx = null) => {
    const client = trx || pool;
    const result = await client.query(
      `UPDATE funding SET approval_status = 'rejected', rejection_reason = $1,
              approved_by = $2, approved_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [reason, approvedBy, id]
    );
    return result.rows[0] || null;
  },

  addPledge: async (fundingId, pledgerId, amount, note) => {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS funding_pledges (
        id SERIAL PRIMARY KEY,
        funding_id INTEGER NOT NULL REFERENCES funding(id) ON DELETE CASCADE,
        pledger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        note TEXT,
        status VARCHAR(50) DEFAULT 'pledged',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    const result = await pool.query(
      `INSERT INTO funding_pledges (funding_id, pledger_id, amount, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [fundingId, pledgerId, amount, note || null]
    );

    const totalPledged = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM funding_pledges
       WHERE funding_id = $1 AND status = 'pledged'`,
      [fundingId]
    );

    return {
      pledge: result.rows[0],
      totalPledged: parseFloat(totalPledged.rows[0].total),
    };
  },
};

module.exports = fundingRepository;
