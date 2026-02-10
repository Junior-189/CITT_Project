const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditLog } = require('../middleware/auditLog');

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 * Protected: Yes
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
  }

  const query = `
    SELECT 
      id, 
      firestore_id,
      name, 
      email, 
      phone, 
      role, 
      created_at, 
      updated_at, 
      deleted_at
    FROM users 
    WHERE id = $1 AND deleted_at IS NULL
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}));

/**
 * PUT /api/auth/me
 * Update current authenticated user's profile
 * Protected: Yes
 */
router.put('/me', authenticateToken, auditLog, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { name, email, phone } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
  }

  // Validate input
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check if email is already taken by another user
  const emailCheck = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL',
    [email, userId]
  );

  if (emailCheck.rows.length > 0) {
    return res.status(409).json({ error: 'Email already in use by another user' });
  }

  const updateQuery = `
    UPDATE users 
    SET 
      name = $1, 
      email = $2, 
      phone = $3, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND deleted_at IS NULL
    RETURNING id, firestore_id, name, email, phone, role, created_at, updated_at
  `;

  const result = await pool.query(updateQuery, [name, email, phone || null, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    message: 'Profile updated successfully',
    user: result.rows[0]
  });
}));

/**
 * GET /api/users/:id
 * Get a specific user's public profile
 * Protected: Yes (but returns limited info)
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID is a number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const query = `
    SELECT 
      id, 
      name, 
      email, 
      phone, 
      role, 
      created_at, 
      updated_at
    FROM users 
    WHERE id = $1 AND deleted_at IS NULL
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Don't expose sensitive fields
  const user = result.rows[0];
  
  res.json(user);
}));

/**
 * PUT /api/users/:id
 * Update a user's profile (admin can update any user)
 * Protected: Yes
 */
router.put('/:id', authenticateToken, auditLog, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  // Validate ID is a number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Users can only update their own profile, unless they're admin
  if (parseInt(id) !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'superAdmin') {
    return res.status(403).json({ error: 'Forbidden - Cannot update another user\'s profile' });
  }

  // Validate input
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check if email is already taken by another user
  const emailCheck = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL',
    [email, id]
  );

  if (emailCheck.rows.length > 0) {
    return res.status(409).json({ error: 'Email already in use by another user' });
  }

  const updateQuery = `
    UPDATE users 
    SET 
      name = $1, 
      email = $2, 
      phone = $3, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND deleted_at IS NULL
    RETURNING id, name, email, phone, role, created_at, updated_at
  `;

  const result = await pool.query(updateQuery, [name, email, phone || null, id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    message: 'User profile updated successfully',
    user: result.rows[0]
  });
}));

module.exports = router;
