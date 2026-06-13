const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcrypt');

const DIRECTOR_ROLES = ['diiDirector', 'debmDirector', 'rtpDirector'];
const ADMIN_ROLES = ['admin', 'superAdmin', 'transferTechnologyOfficer'];

const DEPT_ROLE_MAP = {
  DII: 'diiDirector',
  DEBM: 'debmDirector',
  RTP: 'rtpDirector',
};

const ROLE_TO_DEPT = { diiDirector: 'DII', debmDirector: 'DEBM', rtpDirector: 'RTP' };

// ── GET /api/departments — public list with functions ─────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const depts = await pool.query('SELECT * FROM departments WHERE active = true ORDER BY id');
  const funcs = await pool.query('SELECT * FROM department_functions ORDER BY department_id, order_num');
  const directors = await pool.query(
    `SELECT id, name, email, role, profile_complete, created_at
     FROM users
     WHERE role IN ('diiDirector','debmDirector','rtpDirector') AND deleted_at IS NULL`
  );

  const result = depts.rows.map(dept => ({
    ...dept,
    functions: funcs.rows.filter(f => f.department_id === dept.id),
    director: directors.rows.find(d => ROLE_TO_DEPT[d.role] === dept.code) || null,
  }));

  res.json({ departments: result });
}));

// ── GET /api/departments/directors/all ────────────────────────────────────────
router.get('/directors/all', authenticateToken, asyncHandler(async (req, res) => {
  if (!['superAdmin', 'admin', 'transferTechnologyOfficer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const result = await pool.query(
    `SELECT id, name, email, phone, role, profile_complete, created_at
     FROM users
     WHERE role IN ('diiDirector','debmDirector','rtpDirector') AND deleted_at IS NULL
     ORDER BY role, name`
  );
  res.json({ directors: result.rows });
}));

// ── POST /api/departments/directors/create ────────────────────────────────────
router.post('/directors/create', authenticateToken, asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only SuperAdmin or Admin can create directors' });
  }

  const { name, email, password, department_code, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !department_code) {
    return res.status(400).json({ error: 'name, email, password, and department_code are required' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const deptCode = department_code.toUpperCase();
  const directorRole = DEPT_ROLE_MAP[deptCode];
  if (!directorRole) return res.status(400).json({ error: 'Invalid department_code. Use DII, DEBM, or RTP' });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim()]);
  if (existing.rows.length) return res.status(400).json({ error: 'A user with this email already exists' });

  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', [deptCode]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, role, profile_complete, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())
     RETURNING id, name, email, role, created_at`,
    [name.trim(), email.trim().toLowerCase(), hashedPassword, phone || null, directorRole]
  );

  res.json({ message: `${deptCode} Director created successfully`, director: result.rows[0] });
}));

// ── PUT /api/departments/directors/:id ────────────────────────────────────────
router.put('/directors/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!['superAdmin', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

  const { id } = req.params;
  const { name, email, password, phone, department_code } = req.body;

  const user = await pool.query("SELECT id, role FROM users WHERE id = $1 AND deleted_at IS NULL", [id]);
  if (!user.rows.length) return res.status(404).json({ error: 'Director not found' });
  if (!DIRECTOR_ROLES.includes(user.rows[0].role)) {
    return res.status(400).json({ error: 'This user is not a director' });
  }

  let hashedPassword = null;
  if (password) {
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    hashedPassword = await bcrypt.hash(password, 12);
  }

  let directorRole = null;
  if (department_code) {
    directorRole = DEPT_ROLE_MAP[department_code.toUpperCase()];
    if (!directorRole) return res.status(400).json({ error: 'Invalid department_code' });
  }

  const result = await pool.query(
    `UPDATE users SET
       name = COALESCE($1, name),
       email = COALESCE($2, email),
       password = COALESCE($3, password),
       phone = COALESCE($4, phone),
       role = COALESCE($5, role),
       updated_at = NOW()
     WHERE id = $6
     RETURNING id, name, email, role, phone, created_at`,
    [name || null, email?.toLowerCase() || null, hashedPassword || null, phone || null,
     directorRole || null, id]
  );

  res.json({ message: 'Director updated successfully', director: result.rows[0] });
}));

// ── DELETE /api/departments/directors/:id ─────────────────────────────────────
router.delete('/directors/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!['superAdmin', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

  const user = await pool.query("SELECT id, role, name FROM users WHERE id = $1 AND deleted_at IS NULL", [req.params.id]);
  if (!user.rows.length) return res.status(404).json({ error: 'Director not found' });
  if (!DIRECTOR_ROLES.includes(user.rows[0].role)) {
    return res.status(400).json({ error: 'This user is not a director' });
  }

  await pool.query('UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [req.params.id]);
  res.json({ message: `Director ${user.rows[0].name} removed successfully` });
}));

// ── GET /api/departments/:code ────────────────────────────────────────────────
router.get('/:code', asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();
  const dept = await pool.query('SELECT * FROM departments WHERE code = $1', [code]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });

  const funcs = await pool.query(
    'SELECT * FROM department_functions WHERE department_id = $1 ORDER BY order_num',
    [dept.rows[0].id]
  );
  const director = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users WHERE role = $1 AND deleted_at IS NULL LIMIT 1`,
    [DEPT_ROLE_MAP[code] || '']
  );

  res.json({
    department: { ...dept.rows[0], functions: funcs.rows },
    director: director.rows[0] || null,
  });
}));

// ── GET /api/departments/:code/dashboard ──────────────────────────────────────
router.get('/:code/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const deptCode = req.params.code.toUpperCase();
  const expectedRole = DEPT_ROLE_MAP[deptCode];
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== expectedRole) {
    return res.status(403).json({ error: 'Access denied to this department workspace' });
  }

  const dept = await pool.query('SELECT * FROM departments WHERE code = $1', [deptCode]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });
  const deptId = dept.rows[0].id;

  const funcs = await pool.query(
    'SELECT * FROM department_functions WHERE department_id = $1 ORDER BY order_num',
    [deptId]
  );

  const [totalProjects, pendingProjects, approvedProjects, completedProjects] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL'),
    pool.query("SELECT COUNT(*) FROM projects WHERE approval_status = 'pending'"),
    pool.query("SELECT COUNT(*) FROM projects WHERE approval_status = 'approved'"),
    pool.query("SELECT COUNT(*) FROM projects WHERE project_status = 'completed'"),
  ]);

  const safeCount = async (sql, params = []) => {
    try { const r = await pool.query(sql, params); return parseInt(r.rows[0].count); }
    catch { return 0; }
  };

  const [openComplaints, trainings, businessRecords] = await Promise.all([
    safeCount("SELECT COUNT(*) FROM department_complaints WHERE department_id = $1 AND status IN ('open','in_review')", [deptId]),
    safeCount('SELECT COUNT(*) FROM training_programmes WHERE department_id = $1', [deptId]),
    safeCount('SELECT COUNT(*) FROM business_records WHERE department_id = $1', [deptId]),
  ]);

  let recentActivity = [];
  try {
    const r = await pool.query(
      `SELECT da.*, u.name AS user_name FROM department_activity da
       LEFT JOIN users u ON u.id = da.user_id
       WHERE da.department_id = $1 ORDER BY da.created_at DESC LIMIT 10`,
      [deptId]
    );
    recentActivity = r.rows;
  } catch { /* table not yet created */ }

  res.json({
    department: { ...dept.rows[0], functions: funcs.rows },
    stats: {
      totalProjects: parseInt(totalProjects.rows[0].count),
      pendingProjects: parseInt(pendingProjects.rows[0].count),
      approvedProjects: parseInt(approvedProjects.rows[0].count),
      completedProjects: parseInt(completedProjects.rows[0].count),
      openComplaints,
      trainings,
      businessRecords,
    },
    recentActivity,
  });
}));

// ── GET /api/departments/:code/projects ───────────────────────────────────────
router.get('/:code/projects', authenticateToken, asyncHandler(async (req, res) => {
  const deptCode = req.params.code.toUpperCase();
  const expectedRole = DEPT_ROLE_MAP[deptCode];
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== expectedRole) return res.status(403).json({ error: 'Access denied' });

  const { status, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, u.name AS innovator_name, u.email AS innovator_email,
      (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id = p.id AND pm.status = 'completed') AS completed_milestones,
      (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id = p.id AND pm.status = 'submitted') AS submitted_milestones,
      (SELECT u2.name FROM project_assignments pa JOIN users u2 ON u2.id = pa.assigned_user_id WHERE pa.project_id = p.id AND pa.active = true LIMIT 1) AS assigned_mentor
    FROM projects p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.deleted_at IS NULL
  `;
  let countQuery = `SELECT COUNT(*) FROM projects p LEFT JOIN users u ON u.id = p.user_id WHERE p.deleted_at IS NULL`;
  const params = [];
  const countParams = [];

  if (deptCode === 'DEBM') {
    const debmFilter = ` AND (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id = p.id AND pm.status = 'completed') >= 8`;
    query += debmFilter;
    countQuery += debmFilter;
  }
  if (status) {
    const statusFilter = ` AND p.approval_status = $${params.length + 1}`;
    params.push(status);
    countParams.push(status);
    query += statusFilter;
    countQuery += statusFilter;
  }
  if (search) {
    const searchFilter = ` AND (p.title ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
    query += searchFilter;
    countQuery += searchFilter;
  }

  query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const [result, total] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams),
  ]);

  res.json({
    projects: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.rows[0].count) },
  });
}));

// ── GET /api/departments/:code/complaints ─────────────────────────────────────
router.get('/:code/complaints', authenticateToken, asyncHandler(async (req, res) => {
  const deptCode = req.params.code.toUpperCase();
  const expectedRole = DEPT_ROLE_MAP[deptCode];
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== expectedRole) return res.status(403).json({ error: 'Access denied' });

  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', [deptCode]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });

  try {
    const result = await pool.query(
      `SELECT dc.*, u.name AS submitted_by_name, u.email AS submitted_by_email, a.name AS assigned_to_name
       FROM department_complaints dc
       LEFT JOIN users u ON u.id = dc.submitted_by
       LEFT JOIN users a ON a.id = dc.assigned_to
       WHERE dc.department_id = $1
       ORDER BY dc.created_at DESC`,
      [dept.rows[0].id]
    );
    res.json({ complaints: result.rows });
  } catch { res.json({ complaints: [] }); }
}));

// ── POST /api/departments/:code/complaints ────────────────────────────────────
router.post('/:code/complaints', authenticateToken, asyncHandler(async (req, res) => {
  const { subject, description } = req.body;
  if (!subject?.trim() || !description?.trim()) return res.status(400).json({ error: 'Subject and description are required' });

  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', [req.params.code.toUpperCase()]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });

  try {
    const result = await pool.query(
      `INSERT INTO department_complaints (department_id, submitted_by, subject, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'open', NOW(), NOW()) RETURNING *`,
      [dept.rows[0].id, req.user.id, subject.trim(), description.trim()]
    );
    res.json({ message: 'Complaint submitted successfully', complaint: result.rows[0] });
  } catch { res.status(503).json({ error: 'Complaints system not yet available. Please run pending migrations.' }); }
}));

// ── PUT /api/departments/:code/complaints/:id ─────────────────────────────────
router.put('/:code/complaints/:id', authenticateToken, asyncHandler(async (req, res) => {
  const deptCode = req.params.code.toUpperCase();
  const expectedRole = DEPT_ROLE_MAP[deptCode];
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== expectedRole) return res.status(403).json({ error: 'Access denied' });

  const { status, resolution, assigned_to } = req.body;
  const result = await pool.query(
    `UPDATE department_complaints SET
       status = COALESCE($1, status),
       resolution = COALESCE($2, resolution),
       assigned_to = COALESCE($3, assigned_to),
       updated_at = NOW(),
       resolved_at = CASE WHEN $1 IN ('resolved','closed') THEN NOW() ELSE resolved_at END
     WHERE id = $4 RETURNING *`,
    [status || null, resolution || null, assigned_to || null, req.params.id]
  );
  res.json({ message: 'Complaint updated', complaint: result.rows[0] });
}));

// ── GET /api/departments/:code/trainings ──────────────────────────────────────
router.get('/:code/trainings', authenticateToken, asyncHandler(async (req, res) => {
  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', [req.params.code.toUpperCase()]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });

  try {
    const result = await pool.query(
      `SELECT tp.*, u.name AS created_by_name FROM training_programmes tp
       LEFT JOIN users u ON u.id = tp.created_by
       WHERE tp.department_id = $1 ORDER BY tp.created_at DESC`,
      [dept.rows[0].id]
    );
    res.json({ trainings: result.rows });
  } catch { res.json({ trainings: [] }); }
}));

// ── POST /api/departments/:code/trainings ─────────────────────────────────────
router.post('/:code/trainings', authenticateToken, asyncHandler(async (req, res) => {
  const deptCode = req.params.code.toUpperCase();
  const expectedRole = DEPT_ROLE_MAP[deptCode];
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== expectedRole) return res.status(403).json({ error: 'Access denied' });

  const { title, description, target_audience, status, start_date, end_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', [deptCode]);
  try {
    const result = await pool.query(
      `INSERT INTO training_programmes (department_id, title, description, target_audience, status, start_date, end_date, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *`,
      [dept.rows[0].id, title.trim(), description || null, target_audience || null,
       status || 'planned', start_date || null, end_date || null, req.user.id]
    );
    res.json({ message: 'Training programme created', training: result.rows[0] });
  } catch { res.status(503).json({ error: 'Training system not yet available. Please run pending migrations.' }); }
}));

// ── GET /api/departments/:code/business-records ───────────────────────────────
router.get('/:code/business-records', authenticateToken, asyncHandler(async (req, res) => {
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== 'debmDirector') return res.status(403).json({ error: 'Access denied' });

  const deptCode = req.params.code.toUpperCase();
  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', [deptCode]);
  if (!dept.rows.length) return res.status(404).json({ error: 'Department not found' });

  try {
    const result = await pool.query(
      `SELECT br.*, p.title AS project_title, u.name AS created_by_name
       FROM business_records br
       JOIN projects p ON p.id = br.project_id
       LEFT JOIN users u ON u.id = br.created_by
       WHERE br.department_id = $1 ORDER BY br.created_at DESC`,
      [dept.rows[0].id]
    );
    res.json({ records: result.rows });
  } catch { res.json({ records: [] }); }
}));

// ── POST /api/departments/:code/business-records ──────────────────────────────
router.post('/:code/business-records', authenticateToken, asyncHandler(async (req, res) => {
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== 'debmDirector') return res.status(403).json({ error: 'Access denied' });

  const { project_id, business_name, business_plan, market_status, investment_amount, notes } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  const dept = await pool.query('SELECT id FROM departments WHERE code = $1', ['DEBM']);
  try {
    const result = await pool.query(
      `INSERT INTO business_records (project_id, department_id, business_name, business_plan, market_status, investment_amount, notes, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *`,
      [project_id, dept.rows[0].id, business_name || null, business_plan || null,
       market_status || null, investment_amount || null, notes || null, req.user.id]
    );
    res.json({ message: 'Business record created', record: result.rows[0] });
  } catch { res.status(503).json({ error: 'Business records system not yet available. Please run pending migrations.' }); }
}));

// ── GET /api/departments/:code/innovators ─────────────────────────────────────
router.get('/:code/innovators', authenticateToken, asyncHandler(async (req, res) => {
  const deptCode = req.params.code.toUpperCase();
  const expectedRole = DEPT_ROLE_MAP[deptCode];
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin && req.user.role !== expectedRole) return res.status(403).json({ error: 'Access denied' });

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.university, u.college, u.year_of_study, u.created_at,
            COUNT(p.id) AS total_projects,
            COUNT(CASE WHEN p.approval_status = 'approved' THEN 1 END) AS approved_projects,
            MAX(p.completed_milestones) AS max_milestone_reached
     FROM users u
     LEFT JOIN projects p ON p.user_id = u.id AND p.deleted_at IS NULL
     WHERE u.role = 'innovator' AND u.deleted_at IS NULL
     GROUP BY u.id, u.name, u.email, u.phone, u.university, u.college, u.year_of_study, u.created_at
     ORDER BY u.name`
  );
  res.json({ innovators: result.rows });
}));

module.exports = router;
