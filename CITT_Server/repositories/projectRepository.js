const pool = require('../config/database');

const projectRepository = {
  findById: async (id) => {
    const result = await pool.query(
      `SELECT p.*, u.name as user_name, u.email as user_email,
              approver.name as approved_by_name
       FROM projects p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN users approver ON p.approved_by = approver.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ userId, approvalStatus, projectStatus, isReviewer = false, page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, u.name as user_name, u.email as user_email,
             approver.name as approved_by_name
      FROM projects p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      WHERE 1=1
    `;
    const whereClauses = [];
    const params = [];
    let countParams = [];

    if (!isReviewer && userId) {
      whereClauses.push(`p.user_id = $${params.length + 1}`);
      params.push(userId);
      countParams.push(userId);
    }
    if (approvalStatus) {
      whereClauses.push(`p.approval_status = $${params.length + 1}`);
      params.push(approvalStatus);
    }
    if (projectStatus) {
      whereClauses.push(`p.project_status = $${params.length + 1}`);
      params.push(projectStatus);
    }

    if (whereClauses.length > 0) {
      query += ' AND ' + whereClauses.join(' AND ');
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM projects p';
    if (!isReviewer && userId) {
      countQuery += ' WHERE p.user_id = $1';
    }
    const countResult = await pool.query(countQuery, countParams);

    return {
      projects: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  },

  create: async (projectData) => {
    const { userId, title, description, category, institution, fundingNeeded,
            problemStatement, projectStatus = 'submitted' } = projectData;

    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='projects' AND column_name IN ('institution','funding_needed','problem_statement')`
    );
    const existingCols = colCheck.rows.map(r => r.column_name);

    const insertColumns = ['user_id', 'title', 'description', 'category', 'approval_status', 'project_status'];
    const insertValues = [userId, title, description, category, 'pending', projectStatus];
    const placeholders = insertValues.map((_, i) => `$${i + 1}`);

    if (existingCols.includes('institution')) {
      insertColumns.push('institution');
      const idx = insertColumns.length;
      insertValues.push(institution || null);
      insertColumns.push(...insertColumns.splice(insertColumns.indexOf('approval_status'), 0));
    }

    const result = await pool.query(
      `INSERT INTO projects (user_id, title, description, category, approval_status, project_status${
        existingCols.includes('institution') ? ', institution' : ''
      }${
        existingCols.includes('funding_needed') ? ', funding_needed' : ''
      }${
        existingCols.includes('problem_statement') ? ', problem_statement' : ''
      }) VALUES ($1,$2,$3,$4,$5,$6${
        existingCols.includes('institution') ? ',$7' : ''
      }) RETURNING *`,
      existingCols.includes('institution')
        ? [userId, title, description, category, 'pending', projectStatus, institution || null]
        : [userId, title, description, category, 'pending', projectStatus]
    );
    return result.rows[0];
  },

  createDynamic: async (projectData) => {
    const { userId, title, description, category, institution, fundingNeeded,
            problemStatement, projectStatus = 'submitted' } = projectData;

    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='projects' AND column_name IN ('institution','funding_needed','problem_statement')`
    );
    const existingCols = colCheck.rows.map(r => r.column_name);

    const insertColumns = ['user_id', 'title', 'description', 'category'];
    const insertValues = [userId, title, description, category];

    if (existingCols.includes('institution')) {
      insertColumns.push('institution');
      insertValues.push(institution);
    }
    if (existingCols.includes('funding_needed')) {
      insertColumns.push('funding_needed');
      insertValues.push(fundingNeeded || 0);
    }
    if (existingCols.includes('problem_statement')) {
      insertColumns.push('problem_statement');
      insertValues.push(problemStatement);
    }

    insertColumns.push('approval_status', 'project_status');
    insertValues.push('pending', projectStatus);

    const placeholders = insertValues.map((_, i) => `$${i + 1}`);

    const result = await pool.query(
      `INSERT INTO projects (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      insertValues
    );
    return result.rows[0];
  },

  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = COALESCE($${idx}, ${key})`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  approve: async (id, approvedBy, trx = null) => {
    const client = trx || pool;
    const result = await client.query(
      `UPDATE projects SET approval_status = 'approved', approved_by = $1,
              approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [approvedBy, id]
    );
    return result.rows[0] || null;
  },

  reject: async (id, approvedBy, reason, trx = null) => {
    const client = trx || pool;
    const result = await client.query(
      `UPDATE projects SET approval_status = 'rejected', rejection_reason = $1,
              approved_by = $2, approved_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [reason, approvedBy, id]
    );
    return result.rows[0] || null;
  },

  resubmit: async (id) => {
    const result = await pool.query(
      `UPDATE projects SET approval_status = 'pending', rejection_reason = NULL,
              approved_by = NULL, approved_at = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING title',
      [id]
    );
    return result.rows[0] || null;
  },

  assignReviewer: async (projectId, userId, role) => {
    const result = await pool.query(
      `INSERT INTO project_assignments (project_id, user_id, role, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (project_id, user_id, role) DO UPDATE
       SET active = TRUE, updated_at = NOW()
       RETURNING *`,
      [projectId, userId, role]
    );
    return result.rows[0];
  },

  getMilestones: async (projectId) => {
    const result = await pool.query(
      `SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY stage_order ASC`,
      [projectId]
    );
    return result.rows;
  },
};

module.exports = projectRepository;
