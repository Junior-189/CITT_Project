const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Shared database pool
const pool = require('./config/database');

// Middleware imports
const { authenticateToken } = require('./middleware/auth');
const { errorHandler, notFound, asyncHandler } = require('./middleware/errorHandler');
const { logActivity } = require('./middleware/auditLog');
const { isAdmin } = require('./utils/roleHelpers');

// Route imports
const path = require('path');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superAdmin');
const ipManagerRoutes = require('./routes/ipManager');
const eventsRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');

// ============================================
// BASIC MIDDLEWARE
// ============================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded files (gallery images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATABASE CONNECTION TEST
// ============================================
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log(`Connected to PostgreSQL (${process.env.DB_NAME})`);
    release();
  }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

/**
 * POST /api/auth/register
 * Register new user with role-based access
 */
app.post('/api/auth/register', async (req, res) => {
  const {
    name, email, password, phone, role,
    university, college, year_of_study, firestore_id
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    if (firestore_id) {
      const firestoreExists = await pool.query('SELECT id FROM users WHERE firestore_id = $1', [firestore_id]);
      if (firestoreExists.rows.length > 0) {
        return res.status(400).json({ error: 'User with this firestore_id already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, phone, role, university, college, year_of_study, firestore_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, name, email, phone, role, university, college, year_of_study, profile_complete, firestore_id, created_at`,
      [name, email, hashedPassword, phone, role || 'innovator', university, college, year_of_study, firestore_id]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        university: user.university,
        college: user.college,
        year_of_study: user.year_of_study,
        profile_complete: user.profile_complete,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

/**
 * POST /api/auth/firebase-register
 * Register user via Firebase OAuth
 */
app.post('/api/auth/firebase-register', async (req, res) => {
  const { uid, email, displayName, phoneNumber } = req.body;

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE firestore_id = $1 OR email = $2',
      [uid, email]
    );

    if (userExists.rows.length > 0) {
      const existingUser = userExists.rows[0];
      const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'User logged in successfully',
        token,
        user: existingUser
      });
    }

    const result = await pool.query(
      `INSERT INTO users
       (firestore_id, name, email, phone, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, firestore_id, name, email, phone, role, created_at`,
      [uid, displayName || 'User', email, phoneNumber || null, null, 'innovator']
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firebaseUid: uid },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered and saved to PostgreSQL',
      token,
      user
    });
  } catch (error) {
    console.error('Firebase registration error:', error.message);
    res.status(500).json({
      error: 'Failed to save user to database',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user with email and password
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login event for session tracking
    logActivity({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'LOGIN',
      resource: 'users',
      resource_id: user.id,
      details: { method: 'POST', path: '/api/auth/login' },
      ip_address: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null,
      status: 'success'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        university: user.university,
        college: user.college,
        year_of_study: user.year_of_study,
        profile_complete: user.profile_complete,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/set-password
 * Allow users (especially Google OAuth users) to set their password
 */
app.post('/api/auth/set-password', authenticateToken, async (req, res) => {
  const { password } = req.body;
  const userId = req.user?.id;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role`,
      [hashedPassword, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Password set successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Set password error:', error.message);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (protected route)
 */
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, university, college, year_of_study,
              profile_complete, firestore_id, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password (protected route)
 */
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const result = await pool.query(
      'SELECT id, password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============================================
// PROTECTED USER ENDPOINTS
// ============================================

/**
 * GET /api/users
 * Get all users (protected)
 */
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, university, college, year_of_study,
              profile_complete, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * GET /api/users/:id
 * Get single user (protected)
 */
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, university, college, year_of_study,
              profile_complete, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * PUT /api/users/:id
 * Update user (protected - users can only update their own profile)
 */
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, university, college, year_of_study, profile_complete } = req.body;

  if (req.user.id !== parseInt(id) && !isAdmin(req.user.role)) {
    return res.status(403).json({ error: 'You can only update your own profile' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           university = COALESCE($4, university),
           college = COALESCE($5, college),
           year_of_study = COALESCE($6, year_of_study),
           profile_complete = COALESCE($7, profile_complete),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, email, phone, role, university, college, year_of_study,
                 profile_complete, created_at, updated_at`,
      [name, email, phone, university, college, year_of_study, profile_complete, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (protected - users can only delete their own account)
 */
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== parseInt(id) && !isAdmin(req.user.role)) {
    return res.status(403).json({ error: 'You can only delete your own account' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

/**
 * GET /api/notifications
 * Get all notifications for current user
 */
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, read, link, created_at, updated_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch notifications error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const checkResult = await pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await pool.query(
      'UPDATE notifications SET read = true, updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error.message);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
app.put('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = true, updated_at = NOW() WHERE user_id = $1 AND read = false',
      [req.user.id]
    );

    res.json({
      message: 'All notifications marked as read',
      count: result.rowCount
    });
  } catch (error) {
    console.error('Mark all read error:', error.message);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error.message);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ============================================
// MOUNT ROUTES
// ============================================
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/ipmanager', ipManagerRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/gallery', galleryRoutes);

// ============================================
// SEARCH ENDPOINT (Global Search)
// ============================================

/**
 * GET /api/search?keyword=<keyword>
 * Search across events and users for matching keyword
 */
app.get('/api/search', asyncHandler(async (req, res) => {
  const { keyword } = req.query;

  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const searchTerm = `%${keyword.toLowerCase()}%`;

  const [eventsResult, usersResult] = await Promise.all([
    pool.query(
      `SELECT id, title, description, category, location, start_date, created_at, created_by
       FROM events
       WHERE deleted_at IS NULL
       AND (LOWER(title) LIKE $1
            OR LOWER(description) LIKE $1
            OR LOWER(category) LIKE $1
            OR LOWER(location) LIKE $1)
       ORDER BY start_date DESC
       LIMIT 20`,
      [searchTerm]
    ),
    pool.query(
      `SELECT id, name, email, phone, created_at
       FROM users
       WHERE (LOWER(name) LIKE $1
              OR LOWER(email) LIKE $1)
       AND deleted_at IS NULL
       LIMIT 20`,
      [searchTerm]
    )
  ]);

  res.json({
    events: eventsResult.rows,
    users: usersResult.rows,
    total: eventsResult.rows.length + usersResult.rows.length
  });
}));

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CITT Server running on port ${PORT}`);
});
