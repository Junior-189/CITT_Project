/**
 * Mentor / TC / Coordinator Workspace Routes
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifications');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Upload setup for profile pictures
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const PROFILE_ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PROFILE_ALLOWED_EXT = /\.(jpg|jpeg|png|webp)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extOk = PROFILE_ALLOWED_EXT.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = PROFILE_ALLOWED_MIME.includes(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only JPG, PNG, and WebP image files are allowed'), false);
  },
});

const WORKSPACE_ROLES = ['mentor', 'technicalCommittee', 'coordinator'];
const ADMIN_ROLES = ['admin', 'superAdmin', 'transferTechnologyOfficer'];
const ALL_NOTIFIABLE_ROLES = [
  'admin', 'superAdmin', 'transferTechnologyOfficer',
  'diiDirector', 'debmDirector', 'rtpDirector',
  'mentor', 'technicalCommittee', 'coordinator',
];

const STAGE_NAMES = {
  1: 'Idea Generation', 2: 'Concept Development', 3: 'Prototype Development',
  4: 'Testing & Validation', 5: 'IP & Documentation', 6: 'Funding & Investment',
  7: 'Deployment / Implementation', 8: 'Monitoring & Evaluation', 9: 'Scaling & Commercialization',
};

// ── Helper: notify all relevant admin/director/workspace roles ────────────────
async function notifyAllRoles(excludeUserId, title, message, type) {
  try {
    const res = await pool.query(
      `SELECT id FROM users WHERE role = ANY($1::text[]) AND deleted_at IS NULL AND id != $2`,
      [ALL_NOTIFIABLE_ROLES, excludeUserId || 0]
    );
    for (const u of res.rows) {
      try {
        await createNotification(u.id, title, message, type, null);
      } catch (e) { console.error('Notify error:', e.message); }
    }
  } catch (e) { console.error('notifyAllRoles error:', e.message); }
}

// ── GET /api/workspace/profile ───────────────────────────────────────────────
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ profile: result.rows[0] });
}));

// ── GET /api/workspace/roles ─────────────────────────────────────────────────
router.get('/roles', authenticateToken, asyncHandler(async (req, res) => {
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  const isDiiDirector = req.user.role === 'diiDirector';
  if (!isAdmin && !isDiiDirector && !WORKSPACE_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const result = await pool.query(
    `SELECT id, name, email, phone, role, created_at,
       (SELECT COUNT(*) FROM project_assignments pa WHERE pa.assigned_user_id = u.id AND pa.active = true) AS active_assignments
     FROM users u
     WHERE u.role = ANY($1::text[]) AND u.deleted_at IS NULL
     ORDER BY u.role, u.name`,
    [WORKSPACE_ROLES]
  );
  res.json({
    mentors: result.rows.filter(u => u.role === 'mentor'),
    technicalCommittee: result.rows.filter(u => u.role === 'technicalCommittee'),
    coordinators: result.rows.filter(u => u.role === 'coordinator'),
  });
}));

// ── POST /api/workspace/create ───────────────────────────────────────────────
router.post('/create', authenticateToken, asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role) && req.user.role !== 'diiDirector') {
    return res.status(403).json({ error: 'Only Admin or DII Director can create workspace members' });
  }
  const { name, email, password, phone, role } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  if (!WORKSPACE_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${WORKSPACE_ROLES.join(', ')}` });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  if (existing.rows.length) return res.status(400).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, role, profile_complete, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())
     RETURNING id, name, email, role, created_at`,
    [name.trim(), email.trim().toLowerCase(), hashedPassword, phone || null, role]
  );

  try {
    await notifyAllRoles(req.user.id, `New ${role} Added`,
      `${name} has been added as a ${role} to the CITT system.`, 'user_created');
  } catch (e) { console.error('Notify error:', e.message); }

  res.json({ message: `${role} created successfully`, user: result.rows[0] });
}));

// ── PUT /api/workspace/update/:id ────────────────────────────────────────────
router.put('/update/:id', authenticateToken, upload.single('photo'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  const isSelf = Number(req.user.id) === Number(id);
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Access denied' });

  const { name, phone, password } = req.body;
  let hashedPassword = undefined;
  if (password) {
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    hashedPassword = await bcrypt.hash(password, 12);
  }

  const result = await pool.query(
    `UPDATE users SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       password = COALESCE($3, password),
       updated_at = NOW()
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING id, name, email, role, phone`,
    [name || null, phone || null, hashedPassword || null, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'Profile updated', user: result.rows[0] });
}));

// ── DELETE /api/workspace/delete/:id ────────────────────────────────────────
router.delete('/delete/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  const { id } = req.params;
  const user = await pool.query('SELECT id, name, role FROM users WHERE id=$1 AND deleted_at IS NULL', [id]);
  if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
  if (!WORKSPACE_ROLES.includes(user.rows[0].role)) {
    return res.status(400).json({ error: 'Can only delete mentor/TC/coordinator accounts' });
  }
  await pool.query('UPDATE users SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1', [id]);
  res.json({ message: `${user.rows[0].name} removed successfully` });
}));

// ── GET /api/workspace/my-projects ──────────────────────────────────────────
router.get('/my-projects', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isDirRole = ['diiDirector', 'debmDirector', 'rtpDirector'].includes(userRole);

  let query, params;
  if (isAdmin || isDirRole) {
    query = `
      SELECT p.*, u.name AS innovator_name, u.email AS innovator_email,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='completed') AS completed_milestones,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='submitted') AS pending_review,
        (SELECT json_agg(json_build_object('id',pa2.id,'name',au.name,'role',au.role,'type',pa2.assignment_type))
         FROM project_assignments pa2 JOIN users au ON au.id=pa2.assigned_user_id
         WHERE pa2.project_id=p.id AND pa2.active=true) AS assigned_team
      FROM projects p
      LEFT JOIN users u ON u.id=p.user_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC LIMIT 300`;
    params = [];
  } else {
    query = `
      SELECT p.*, u.name AS innovator_name, u.email AS innovator_email,
        pa.assignment_type AS my_role,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='completed') AS completed_milestones,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='submitted') AS pending_review,
        (SELECT json_agg(json_build_object('id',pa2.id,'name',au.name,'role',au.role,'type',pa2.assignment_type))
         FROM project_assignments pa2 JOIN users au ON au.id=pa2.assigned_user_id
         WHERE pa2.project_id=p.id AND pa2.active=true) AS assigned_team
      FROM projects p
      JOIN project_assignments pa ON pa.project_id=p.id AND pa.assigned_user_id=$1 AND pa.active=true
      LEFT JOIN users u ON u.id=p.user_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC`;
    params = [userId];
  }

  const result = await pool.query(query, params);
  res.json({ projects: result.rows });
}));

// ── GET /api/workspace/project/:id/detail ───────────────────────────────────
router.get('/project/:id/detail', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isDirRole = ['diiDirector', 'debmDirector', 'rtpDirector'].includes(userRole);

  if (!isAdmin && !isDirRole) {
    const assigned = await pool.query(
      'SELECT id FROM project_assignments WHERE project_id=$1 AND assigned_user_id=$2 AND active=true',
      [id, userId]
    );
    if (!assigned.rows.length) return res.status(403).json({ error: 'Access denied' });
  }

  const [projectRes, milestonesRes, commentsRes, assignmentsRes] = await Promise.all([
    pool.query(
      `SELECT p.*, u.name AS innovator_name, u.email AS innovator_email, u.phone AS innovator_phone
       FROM projects p LEFT JOIN users u ON u.id=p.user_id WHERE p.id=$1`, [id]
    ),
    pool.query(
      `SELECT m.*, s.name AS submitted_by_name, a.name AS approved_by_name
       FROM project_milestones m
       LEFT JOIN users s ON s.id=m.submitted_by
       LEFT JOIN users a ON a.id=m.approved_by
       WHERE m.project_id=$1 ORDER BY m.stage_number`, [id]
    ),
    pool.query(
      `SELECT mc.*, u.name AS commenter_name, u.role AS commenter_role
       FROM milestone_comments mc
       JOIN users u ON u.id=mc.commented_by
       WHERE mc.project_id=$1 ORDER BY mc.created_at DESC`, [id]
    ),
    pool.query(
      `SELECT pa.*, u.name AS member_name, u.role AS member_role, u.email AS member_email
       FROM project_assignments pa JOIN users u ON u.id=pa.assigned_user_id
       WHERE pa.project_id=$1 AND pa.active=true`, [id]
    ),
  ]);

  if (!projectRes.rows.length) return res.status(404).json({ error: 'Project not found' });

  res.json({
    project: projectRes.rows[0],
    milestones: milestonesRes.rows,
    comments: commentsRes.rows,
    team: assignmentsRes.rows,
  });
}));

// ── POST /api/workspace/project/:id/comment ─────────────────────────────────
router.post('/project/:id/comment', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stage_number, comment, comment_type } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!comment?.trim()) return res.status(400).json({ error: 'Comment is required' });
  if (!stage_number) return res.status(400).json({ error: 'stage_number is required' });

  const allowedRoles = [...WORKSPACE_ROLES, ...ADMIN_ROLES, 'diiDirector', 'debmDirector', 'rtpDirector'];
  if (!allowedRoles.includes(userRole)) return res.status(403).json({ error: 'Access denied' });

  if (!ADMIN_ROLES.includes(userRole) && !['diiDirector', 'debmDirector', 'rtpDirector'].includes(userRole)) {
    const assigned = await pool.query(
      'SELECT id FROM project_assignments WHERE project_id=$1 AND assigned_user_id=$2 AND active=true',
      [id, userId]
    );
    if (!assigned.rows.length) return res.status(403).json({ error: 'You are not assigned to this project' });
  }

  const milestoneRes = await pool.query(
    'SELECT id FROM project_milestones WHERE project_id=$1 AND stage_number=$2', [id, stage_number]
  );
  const milestoneId = milestoneRes.rows[0]?.id || null;

  const result = await pool.query(
    `INSERT INTO milestone_comments (project_id, milestone_id, stage_number, commented_by, comment, comment_type, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
    [id, milestoneId, stage_number, userId, comment.trim(), comment_type || 'feedback']
  );

  const [commenterRes, projectRes] = await Promise.all([
    pool.query('SELECT name, role FROM users WHERE id=$1', [userId]),
    pool.query('SELECT user_id, title FROM projects WHERE id=$1', [id]),
  ]);
  const commenterName = commenterRes.rows[0]?.name || 'Team member';
  const commenterRole = commenterRes.rows[0]?.role || '';
  const project = projectRes.rows[0];

  if (project) {
    try {
      await createNotification(
        project.user_id,
        `New Feedback on Stage ${stage_number}`,
        `${commenterName} (${commenterRole}) left ${comment_type || 'feedback'} on Stage ${stage_number} (${STAGE_NAMES[stage_number]}) of your project "${project.title}".`,
        'milestone_comment',
        null
      );
    } catch (e) { console.error('Notify error:', e.message); }

    try {
      const teamRes = await pool.query(
        'SELECT assigned_user_id FROM project_assignments WHERE project_id=$1 AND active=true AND assigned_user_id!=$2',
        [id, userId]
      );
      for (const tm of teamRes.rows) {
        await createNotification(
          tm.assigned_user_id,
          `Team Comment: Stage ${stage_number}`,
          `${commenterName} commented on Stage ${stage_number} of project "${project.title}".`,
          'milestone_comment', null
        );
      }
    } catch (e) { console.error('Team notify error:', e.message); }
  }

  res.json({ message: 'Comment added', comment: result.rows[0] });
}));

// ── PUT /api/workspace/project/:id/milestone/:stageId/approve ───────────────
router.put('/project/:id/milestone/:stageId/approve', authenticateToken, asyncHandler(async (req, res) => {
  const { id, stageId } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const stageNum = parseInt(stageId);

  const allowedRoles = [...WORKSPACE_ROLES, ...ADMIN_ROLES, 'diiDirector', 'debmDirector', 'rtpDirector'];
  if (!allowedRoles.includes(userRole)) return res.status(403).json({ error: 'Access denied' });
  if (!notes?.trim()) return res.status(400).json({ error: 'Approval notes are required' });

  const result = await pool.query(
    `UPDATE project_milestones SET status='completed', approved_by=$1, approval_notes=$2, approved_at=NOW(), updated_at=NOW()
     WHERE project_id=$3 AND stage_number=$4 AND status='submitted' RETURNING *`,
    [userId, notes.trim(), id, stageNum]
  );
  if (!result.rows.length) {
    return res.status(404).json({ error: 'Milestone not found or not in submitted status' });
  }

  if (stageNum < 9) {
    await pool.query(
      `INSERT INTO project_milestones (project_id, stage_number, stage_name, status, created_at, updated_at)
       VALUES ($1,$2,$3,'in_progress',NOW(),NOW()) ON CONFLICT (project_id, stage_number) DO NOTHING`,
      [id, stageNum + 1, STAGE_NAMES[stageNum + 1]]
    );
  }

  const projectRes = await pool.query('SELECT user_id, title FROM projects WHERE id=$1', [id]);
  const project = projectRes.rows[0];
  const approverRes = await pool.query('SELECT name, role FROM users WHERE id=$1', [userId]);
  const approverName = approverRes.rows[0]?.name || 'Reviewer';

  if (stageNum === 9) {
    await pool.query("UPDATE projects SET project_status='completed', updated_at=NOW() WHERE id=$1", [id]);
    try {
      const debmRes = await pool.query("SELECT id FROM users WHERE role='debmDirector' AND deleted_at IS NULL");
      for (const u of debmRes.rows) {
        await createNotification(u.id,
          'Project Ready for Commercialization',
          `Project "${project?.title}" has completed all 9 milestone stages and is ready for commercialization.`,
          'project_completed', null
        );
      }
    } catch (e) { console.error('DEBM notify error:', e.message); }
  }

  if (project) {
    try {
      await createNotification(
        project.user_id,
        `Stage ${stageNum} Approved`,
        `${approverName} approved your Stage ${stageNum} (${STAGE_NAMES[stageNum]}) for project "${project.title}".${stageNum < 9 ? ` You can now proceed to Stage ${stageNum + 1}: ${STAGE_NAMES[stageNum + 1]}.` : ' Congratulations — all stages complete!'}`,
        'milestone_approved', null
      );
    } catch (e) { console.error('Notify error:', e.message); }
  }

  try {
    const adminRes = await pool.query(
      `SELECT id FROM users WHERE role=ANY($1::text[]) AND deleted_at IS NULL AND id!=$2`,
      [[...ADMIN_ROLES, 'diiDirector', 'debmDirector', 'rtpDirector'], userId]
    );
    for (const u of adminRes.rows) {
      await createNotification(u.id,
        `Stage ${stageNum} Approved`,
        `${approverName} approved Stage ${stageNum} (${STAGE_NAMES[stageNum]}) for project "${project?.title}".`,
        'milestone_approved', null
      );
    }
  } catch (e) { console.error('Admin notify error:', e.message); }

  res.json({ message: 'Milestone approved', milestone: result.rows[0] });
}));

// ── PUT /api/workspace/project/:id/milestone/:stageId/reject ────────────────
router.put('/project/:id/milestone/:stageId/reject', authenticateToken, asyncHandler(async (req, res) => {
  const { id, stageId } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const stageNum = parseInt(stageId);

  const allowedRoles = [...WORKSPACE_ROLES, ...ADMIN_ROLES, 'diiDirector', 'debmDirector', 'rtpDirector'];
  if (!allowedRoles.includes(userRole)) return res.status(403).json({ error: 'Access denied' });
  if (!notes?.trim()) return res.status(400).json({ error: 'Rejection reason is required' });

  const result = await pool.query(
    `UPDATE project_milestones SET status='rejected', approved_by=$1, rejection_reason=$2, updated_at=NOW()
     WHERE project_id=$3 AND stage_number=$4 AND status='submitted' RETURNING *`,
    [userId, notes.trim(), id, stageNum]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Milestone not found or not in submitted status' });

  const projectRes = await pool.query('SELECT user_id, title FROM projects WHERE id=$1', [id]);
  const project = projectRes.rows[0];
  const rejectorRes = await pool.query('SELECT name, role FROM users WHERE id=$1', [userId]);
  const rejectorName = rejectorRes.rows[0]?.name || 'Reviewer';

  if (project) {
    try {
      await createNotification(
        project.user_id,
        `Stage ${stageNum} Needs Revision`,
        `${rejectorName} requested revision on Stage ${stageNum} (${STAGE_NAMES[stageNum]}) for project "${project.title}". Reason: ${notes.trim()}`,
        'milestone_rejected', null
      );
    } catch (e) { console.error('Notify error:', e.message); }

    try {
      const teamRes = await pool.query(
        'SELECT assigned_user_id FROM project_assignments WHERE project_id=$1 AND active=true AND assigned_user_id!=$2',
        [id, userId]
      );
      for (const tm of teamRes.rows) {
        await createNotification(tm.assigned_user_id,
          `Stage ${stageNum} Sent for Revision`,
          `${rejectorName} requested revision on Stage ${stageNum} of "${project.title}".`,
          'milestone_rejected', null
        );
      }
    } catch (e) { console.error('Team notify error:', e.message); }
  }

  res.json({ message: 'Milestone sent for revision', milestone: result.rows[0] });
}));

// ── GET /api/workspace/stats ─────────────────────────────────────────────────
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole) || ['diiDirector', 'debmDirector', 'rtpDirector'].includes(userRole);

  const [assignedCount, pendingReviews, completedProjects, totalProjects, unreadNotifs] = await Promise.all([
    isAdmin
      ? pool.query('SELECT COUNT(DISTINCT project_id) FROM project_assignments WHERE active=true')
      : pool.query('SELECT COUNT(*) FROM project_assignments WHERE assigned_user_id=$1 AND active=true', [userId]),
    isAdmin
      ? pool.query("SELECT COUNT(*) FROM project_milestones WHERE status='submitted'")
      : pool.query(
          `SELECT COUNT(*) FROM project_milestones pm
           JOIN project_assignments pa ON pa.project_id=pm.project_id
           WHERE pa.assigned_user_id=$1 AND pa.active=true AND pm.status='submitted'`, [userId]
        ),
    isAdmin
      ? pool.query("SELECT COUNT(*) FROM projects WHERE project_status='completed' AND deleted_at IS NULL")
      : pool.query(
          `SELECT COUNT(*) FROM projects p
           JOIN project_assignments pa ON pa.project_id=p.id
           WHERE pa.assigned_user_id=$1 AND pa.active=true AND p.project_status='completed'`, [userId]
        ),
    pool.query('SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL'),
    pool.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read=false', [userId]),
  ]);

  res.json({
    assignedProjects: parseInt(assignedCount.rows[0].count),
    pendingReviews: parseInt(pendingReviews.rows[0].count),
    completedProjects: parseInt(completedProjects.rows[0].count),
    totalProjects: parseInt(totalProjects.rows[0].count),
    unreadNotifications: parseInt(unreadNotifs.rows[0].count),
  });
}));

// ── Director Profile Photos ──────────────────────────────────────────────────
const directorUploadDir = path.join(__dirname, '../uploads/directors');
if (!fs.existsSync(directorUploadDir)) fs.mkdirSync(directorUploadDir, { recursive: true });

const directorStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, directorUploadDir),
  filename: (req, file, cb) =>
    cb(null, `director-${req.params.code}-${Date.now()}${path.extname(file.originalname)}`),
});
const directorUpload = multer({ storage: directorStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post(
  '/director-photo/:code',
  authenticateToken,
  directorUpload.single('photo'),
  asyncHandler(async (req, res) => {
    const allowed = [...ADMIN_ROLES, 'superAdmin'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only Admin or SuperAdmin can upload director photos' });
    }
    if (!req.file) return res.status(400).json({ error: 'Photo file is required' });

    const { code } = req.params;
    const photoUrl = `/uploads/directors/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO director_profiles (department_code, photo_url, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (department_code) DO UPDATE SET photo_url=$2, updated_by=$3, updated_at=NOW()
       RETURNING *`,
      [code.toUpperCase(), photoUrl, req.user.id]
    );

    res.json({ message: 'Director photo updated', photoUrl, profile: result.rows[0] });
  })
);

router.get('/director-photos', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM director_profiles ORDER BY department_code');
  res.json({ photos: result.rows });
}));

// ── POST /api/workspace/my-director-photo ────────────────────────────────────
router.post(
  '/my-director-photo',
  authenticateToken,
  directorUpload.single('photo'),
  asyncHandler(async (req, res) => {
    const directorRoles = ['diiDirector', 'debmDirector', 'rtpDirector'];
    if (!directorRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only Directors can use this endpoint' });
    }

    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const codeMap = { diiDirector: 'DII', debmDirector: 'DEBM', rtpDirector: 'RTP' };
    const code = codeMap[req.user.role];
    const photoUrl = `/uploads/directors/${req.file.filename}`;

    await pool.query(
      `INSERT INTO director_profiles (department_code, photo_url, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (department_code) DO UPDATE SET photo_url=$2, updated_by=$3, updated_at=NOW()`,
      [code, photoUrl, req.user.id]
    );

    await pool.query(
      `UPDATE users SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2`,
      [photoUrl, req.user.id]
    );

    res.json({ message: 'Director photo updated successfully', photo_url: photoUrl });
  })
);

module.exports = router;
