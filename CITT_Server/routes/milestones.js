const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifications');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/milestones');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/jpg', 'image/png',
];
const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
});
const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only PDF, Word, JPG, and PNG files are allowed'), false);
};
const upload = multer({ storage, limits: { fileSize: 10*1024*1024 }, fileFilter });

const STAGE_NAMES = {
  1:'Idea Generation', 2:'Concept Development', 3:'Prototype Development',
  4:'Testing & Validation', 5:'IP & Documentation', 6:'Funding & Investment',
  7:'Deployment / Implementation', 8:'Monitoring & Evaluation', 9:'Scaling & Commercialization',
};

const REVIEWER_ROLES = ['admin','superAdmin','transferTechnologyOfficer','diiDirector','debmDirector','rtpDirector','mentor','technicalCommittee','coordinator'];

// GET milestones for a project
router.get('/:projectId/milestones', authenticateToken, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const projectRes = await pool.query('SELECT id, user_id, title, approval_status FROM projects WHERE id = $1', [projectId]);
  if (!projectRes.rows.length) return res.status(404).json({ error: 'Project not found' });
  const project = projectRes.rows[0];

  const isOwner = Number(project.user_id) === Number(userId);
  const isReviewer = REVIEWER_ROLES.includes(userRole);
  if (!isOwner && !isReviewer) {
    const a = await pool.query('SELECT id FROM project_assignments WHERE project_id=$1 AND assigned_user_id=$2 AND active=true', [projectId, userId]);
    if (!a.rows.length) return res.status(403).json({ error: 'Access denied' });
  }

  const [mRes, aRes, cRes] = await Promise.all([
    pool.query(
      `SELECT m.*, s.name AS submitted_by_name, a.name AS approved_by_name
       FROM project_milestones m
       LEFT JOIN users s ON s.id = m.submitted_by
       LEFT JOIN users a ON a.id = m.approved_by
       WHERE m.project_id = $1 ORDER BY m.stage_number`, [projectId]
    ),
    pool.query(
      `SELECT pa.*, u.name AS mentor_name, u.email AS mentor_email
       FROM project_assignments pa JOIN users u ON u.id = pa.assigned_user_id
       WHERE pa.project_id=$1 AND pa.active=true LIMIT 1`, [projectId]
    ),
    pool.query(
      `SELECT mc.*, u.name AS commenter_name, u.role AS commenter_role
       FROM milestone_comments mc
       LEFT JOIN users u ON u.id = mc.commented_by
       WHERE mc.project_id = $1
       ORDER BY mc.created_at ASC`, [projectId]
    )
  ]);
  res.json({ milestones: mRes.rows, assignment: aRes.rows[0] || null, comments: cRes.rows });
}));

// Submit a milestone stage
router.post('/:projectId/milestones/:stageId/submit', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  const { projectId, stageId } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;
  const stageNum = parseInt(stageId);

  if (stageNum < 1 || stageNum > 9) return res.status(400).json({ error: 'Invalid stage number' });
  if (!notes?.trim()) return res.status(400).json({ error: 'Submission notes are required' });

  const projectRes = await pool.query('SELECT id, user_id, title, approval_status FROM projects WHERE id=$1', [projectId]);
  if (!projectRes.rows.length) return res.status(404).json({ error: 'Project not found' });
  const project = projectRes.rows[0];
  if (Number(project.user_id) !== Number(userId)) return res.status(403).json({ error: 'You can only submit milestones for your own projects' });
  if (project.approval_status !== 'approved') return res.status(400).json({ error: 'Project must be approved before submitting milestones' });

  const fileUrl = req.file ? `/uploads/milestones/${req.file.filename}` : null;
  const result = await pool.query(
    `INSERT INTO project_milestones (project_id, stage_number, stage_name, status, submitted_by, submission_notes, file_url, submitted_at, updated_at)
     VALUES ($1,$2,$3,'submitted',$4,$5,$6,NOW(),NOW())
     ON CONFLICT (project_id, stage_number) DO UPDATE SET
       status='submitted', submitted_by=$4, submission_notes=$5,
       file_url=COALESCE($6, project_milestones.file_url),
       submitted_at=NOW(), updated_at=NOW(), rejection_reason=NULL
     RETURNING *`,
    [projectId, stageNum, STAGE_NAMES[stageNum], userId, notes.trim(), fileUrl]
  );

  try {
    const assigned = await pool.query('SELECT assigned_user_id FROM project_assignments WHERE project_id=$1 AND active=true', [projectId]);
    const admins = await pool.query("SELECT id FROM users WHERE role IN ('admin','superAdmin','transferTechnologyOfficer','diiDirector','debmDirector','coordinator') AND deleted_at IS NULL AND account_status='approved'");
    const uids = [...assigned.rows.map(r=>r.assigned_user_id), ...admins.rows.map(r=>r.id)].filter((v,i,a)=>a.indexOf(v)===i);
    for (const uid of uids) {
      await createNotification(uid, `Milestone Submitted: Stage ${stageNum}`, `Innovator submitted "${STAGE_NAMES[stageNum]}" for project "${project.title}". Please review.`, 'milestone_submitted', '/workspace');
    }
    const workspaceUsersRes = await pool.query(
      `SELECT id FROM users
       WHERE role IN ('mentor','technicalCommittee','coordinator','admin','transferTechnologyOfficer')
       AND deleted_at IS NULL AND account_status = 'approved'
       AND id != ALL($1::int[])`,
      [uids.length ? uids : [0]]
    );
    for (const wu of workspaceUsersRes.rows) {
      await createNotification(wu.id, `Milestone Submitted: Stage ${stageNum}`, `Innovator submitted "${STAGE_NAMES[stageNum]}" for project "${project.title}". Please review.`, 'milestone_submitted', '/workspace');
    }
  } catch(e) { console.error('Notification error:', e.message); }

  res.json({ message: `Stage ${stageNum} submitted successfully`, milestone: result.rows[0] });
}));

// Approve a milestone
router.put('/:projectId/milestones/:stageId/approve', authenticateToken, asyncHandler(async (req, res) => {
  const { projectId, stageId } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;
  const stageNum = parseInt(stageId);

  if (!REVIEWER_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Permission denied' });

  const result = await pool.query(
    `UPDATE project_milestones SET status='completed', approved_by=$1, approval_notes=$2, approved_at=NOW(), updated_at=NOW()
     WHERE project_id=$3 AND stage_number=$4 AND status='submitted' RETURNING *`,
    [userId, notes||'Approved', projectId, stageNum]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Milestone not found or not in submitted status' });

  if (stageNum < 9) {
    await pool.query(
      `INSERT INTO project_milestones (project_id, stage_number, stage_name, status, created_at, updated_at)
       VALUES ($1,$2,$3,'in_progress',NOW(),NOW()) ON CONFLICT (project_id, stage_number) DO NOTHING`,
      [projectId, stageNum+1, STAGE_NAMES[stageNum+1]]
    );
  }

  try {
    const pRes = await pool.query('SELECT user_id, title FROM projects WHERE id=$1', [projectId]);
    if (pRes.rows.length) {
      const { user_id, title } = pRes.rows[0];
      const nextMsg = stageNum < 9 ? ` Proceed to Stage ${stageNum+1}: ${STAGE_NAMES[stageNum+1]}.` : ' Congratulations on completing all stages!';
      await createNotification(user_id, `Stage ${stageNum} Approved`, `Your "${STAGE_NAMES[stageNum]}" stage for "${title}" has been approved.${nextMsg}`, 'milestone_approved', '/projects');
    }
  } catch(e) { console.error('Notification error:', e.message); }

  res.json({ message: 'Milestone approved', milestone: result.rows[0] });
}));

// Reject a milestone
router.put('/:projectId/milestones/:stageId/reject', authenticateToken, asyncHandler(async (req, res) => {
  const { projectId, stageId } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;
  const stageNum = parseInt(stageId);

  if (!REVIEWER_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Permission denied' });
  if (!notes?.trim()) return res.status(400).json({ error: 'Rejection notes are required' });

  const result = await pool.query(
    `UPDATE project_milestones SET status='rejected', approved_by=$1, rejection_reason=$2, updated_at=NOW()
     WHERE project_id=$3 AND stage_number=$4 RETURNING *`,
    [userId, notes.trim(), projectId, stageNum]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Milestone not found' });

  try {
    const pRes = await pool.query('SELECT user_id, title FROM projects WHERE id=$1', [projectId]);
    if (pRes.rows.length) {
      const { user_id, title } = pRes.rows[0];
      await createNotification(user_id, `Stage ${stageNum} Needs Revision`, `Your "${STAGE_NAMES[stageNum]}" stage for "${title}" requires changes. Reason: ${notes.trim()}`, 'milestone_rejected', '/projects');
    }
  } catch(e) { console.error('Notification error:', e.message); }

  res.json({ message: 'Milestone sent back for revision', milestone: result.rows[0] });
}));

// Assign mentor/TC to project
router.post('/:projectId/assign', authenticateToken, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { assigned_user_id, assignment_type } = req.body;
  const assignedBy = req.user.id;
  const allowedRoles = ['admin','superAdmin','transferTechnologyOfficer','diiDirector'];

  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Permission denied' });
  if (!assigned_user_id) return res.status(400).json({ error: 'assigned_user_id is required' });
  if (!['mentor','technical_committee','coordinator'].includes(assignment_type)) return res.status(400).json({ error: 'Invalid assignment_type' });

  const projectRes = await pool.query('SELECT id, title, user_id FROM projects WHERE id=$1', [projectId]);
  if (!projectRes.rows.length) return res.status(404).json({ error: 'Project not found' });

  const userRes = await pool.query('SELECT id, name FROM users WHERE id=$1 AND deleted_at IS NULL', [assigned_user_id]);
  if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

  const result = await pool.query(
    `INSERT INTO project_assignments (project_id, assigned_user_id, assigned_by, assignment_type, assigned_at, active)
     VALUES ($1,$2,$3,$4,NOW(),true)
     ON CONFLICT (project_id, assigned_user_id, assignment_type) DO UPDATE SET active=true, assigned_by=$3, assigned_at=NOW()
     RETURNING *`,
    [projectId, assigned_user_id, assignedBy, assignment_type]
  );

  await pool.query(
    `INSERT INTO project_milestones (project_id, stage_number, stage_name, status, created_at, updated_at)
     VALUES ($1,1,'Idea Generation','in_progress',NOW(),NOW()) ON CONFLICT (project_id, stage_number) DO NOTHING`,
    [projectId]
  );

  try {
    const p = projectRes.rows[0];
    await createNotification(parseInt(assigned_user_id), 'New Project Assignment', `You have been assigned as ${assignment_type.replace('_',' ')} for project "${p.title}".`, 'project_assigned', '/workspace');
    await createNotification(p.user_id, 'Mentor/TC Assigned', `${userRes.rows[0].name} has been assigned as your ${assignment_type.replace('_',' ')} for "${p.title}".`, 'project_assigned', '/projects');
  } catch(e) { console.error('Notification error:', e.message); }

  res.json({ message: 'Assigned successfully', assignment: result.rows[0] });
}));

// Mentor's assigned projects
router.get('/mentor/projects', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const isAdmin = ['admin','superAdmin','transferTechnologyOfficer'].includes(userRole);

  const query = isAdmin
    ? `SELECT p.*, u.name AS innovator_name,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='submitted') AS submitted_milestones
       FROM projects p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 200`
    : `SELECT p.*, u.name AS innovator_name, pa.assignment_type,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='submitted') AS submitted_milestones
       FROM projects p
       JOIN project_assignments pa ON pa.project_id=p.id AND pa.assigned_user_id=$1 AND pa.active=true
       LEFT JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC`;

  const result = await pool.query(query, isAdmin ? [] : [userId]);
  res.json({ projects: result.rows });
}));

// TC assigned projects
router.get('/tc/projects', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const isAdmin = ['admin','superAdmin','transferTechnologyOfficer'].includes(userRole);

  const query = isAdmin
    ? `SELECT p.*, u.name AS innovator_name,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='submitted') AS submitted_milestones
       FROM projects p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 200`
    : `SELECT p.*, u.name AS innovator_name, pa.assignment_type,
        (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='submitted') AS submitted_milestones
       FROM projects p
       JOIN project_assignments pa ON pa.project_id=p.id AND pa.assigned_user_id=$1 AND pa.active=true AND pa.assignment_type='technical_committee'
       LEFT JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC`;

  const result = await pool.query(query, isAdmin ? [] : [userId]);
  res.json({ projects: result.rows });
}));

// Coordinator projects
router.get('/coordinator/projects', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, u.name AS innovator_name,
      (SELECT COUNT(*) FROM project_milestones pm WHERE pm.project_id=p.id AND pm.status='completed') AS completed_milestones
     FROM projects p LEFT JOIN users u ON u.id=p.user_id WHERE p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 500`
  );
  res.json({ projects: result.rows });
}));

module.exports = router;
