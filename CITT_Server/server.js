const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const pool = require('./config/database');
const logger = require('./config/logger');

const { authenticateToken } = require('./middleware/auth');
const { errorHandler, notFound, asyncHandler } = require('./middleware/errorHandler');
const { logActivity } = require('./middleware/auditLog');
const { validate } = require('./middleware/validate');
const { isAdmin } = require('./utils/roleHelpers');

const {
  registerSchema, loginSchema, changePasswordSchema, setPasswordSchema,
  forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema,
  firebaseRegisterSchema, updateProfileSchema,
  searchQuerySchema, userCreateSchema, userRoleChangeSchema,
} = require('./validators');

const {
  blacklistToken, isBlacklisted,
  storeRefreshTokenFamily, revokeRefreshTokenFamily, isRefreshTokenFamilyRevoked,
  connectRedis,
} = require('./services/redis');

const { sendPasswordResetEmail, sendVerificationEmail } = require('./services/email');

const path = require('path');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superAdmin');
const ipManagerRoutes = require('./routes/ipManager');
const eventsRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const milestonesRoutes = require('./routes/milestones');
const departmentsRoutes = require('./routes/departments');
const mentorWorkspaceRoutes = require('./routes/mentorWorkspace');
const contactRoutes = require('./routes/contact');

// ============================================
// LOGGING MIDDLEWARE
// ============================================
const morganFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : ':method :url :status :response-time ms - :res[content-length]';

app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",
        "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'",
        process.env.FRONTEND_URL || "http://localhost:5173",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com"],
      frameSrc: ["'self'", "https://*.firebaseapp.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
}));

// Rate limiting: Strict for auth, general for API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: (hits) => hits * 500,
  maxDelayMs: 10000,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalSpeedLimiter = slowDown({
  windowMs: 1 * 60 * 1000,
  delayAfter: 60,
  delayMs: (hits) => (hits - 60) * 200,
  maxDelayMs: 5000,
});

// Strict limiter for password reset / sensitive operations
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter, authSpeedLimiter);
app.use('/api/auth/register', authLimiter, authSpeedLimiter);
app.use('/api/auth/forgot-password', sensitiveLimiter);
app.use('/api/auth/reset-password', sensitiveLimiter);
app.use('/api/auth/refresh', rateLimit({ windowMs: 60000, max: 30 }));

// General rate limit for all non-auth API routes
const skipAuthPaths = (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  generalLimiter(req, res, next);
};
app.use('/api/', skipAuthPaths, generalSpeedLimiter);

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000',
     'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  dotfiles: 'deny',
}));

// ============================================
// HELPER: Generate tokens
// ============================================
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const JWT_SECRET = process.env.JWT_SECRET;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const generateTokenFamily = () => {
  return crypto.randomBytes(16).toString('hex');
};

const storeRefreshTokenInDb = async (userId, token, family, expiresAt) => {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, family, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, hashToken(token), family, expiresAt]
  );
};


const rotateRefreshToken = async (oldToken) => {
  const oldHash = hashToken(oldToken);
  const result = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()`,
    [oldHash]
  );

  if (result.rows.length === 0) return null;

  const oldRecord = result.rows[0];

  const redisRevoked = await isRefreshTokenFamilyRevoked(oldRecord.family);
  if (redisRevoked) return null;

  // Mark old token as revoked
  await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [oldRecord.id]);

  // Generate new refresh token in the same family
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await storeRefreshTokenInDb(oldRecord.user_id, newRefreshToken, oldRecord.family, expiresAt);

  const userResult = await pool.query(
    'SELECT id, email, role, name FROM users WHERE id = $1',
    [oldRecord.user_id]
  );

  if (userResult.rows.length === 0) return null;

  const accessToken = generateAccessToken(userResult.rows[0]);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: userResult.rows[0],
  };
};

// ============================================
// DATABASE CONNECTION
// ============================================
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Database connection failed', { message: err.message });
  } else {
    logger.info(`PostgreSQL connected (${process.env.DB_NAME})`);
    release();
  }
});

// Connect Redis (non-blocking)
connectRedis().catch(() => {});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

/**
 * POST /api/auth/register
 * Register new user with comprehensive validation
 */
app.post('/api/auth/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const {
      name, email, password, phone,
      university, campus, college, year_of_study, firestore_id
    } = req.body;

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    if (firestore_id) {
      const firestoreExists = await pool.query('SELECT id FROM users WHERE firestore_id = $1', [firestore_id]);
      if (firestoreExists.rows.length > 0) {
        return res.status(409).json({ error: 'User with this firestore_id already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, phone, role, university, campus, college, year_of_study, firestore_id, account_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())
       RETURNING id, name, email, phone, role, university, campus, account_status, created_at`,
      [name, email, hashedPassword, phone || null,
       'innovator',
       university || null, campus || null, college || null, year_of_study || null, firestore_id || null]
    );

    logger.info('User registered', { email, userId: result.rows[0].id });

    // Generate verification token and send email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await pool.query(
      `UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3`,
      [verificationToken, verificationExpires, result.rows[0].id]
    );
    sendVerificationEmail(email, name, verificationToken).catch(() => {});

    res.status(201).json({
      message: 'Registration successful. Your account is awaiting admin approval.',
      pending: true,
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role,
        account_status: 'pending'
      }
    });
  })
);

/**
 * POST /api/auth/login
 * Login with email + password, return access + refresh tokens
 */
app.post('/api/auth/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.deleted_at) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.account_status === 'pending') {
      return res.status(403).json({
        error: 'account_pending',
        message: `Hi ${user.name}, your account is awaiting admin approval.`
      });
    }
    if (user.account_status === 'rejected') {
      return res.status(403).json({
        error: 'account_rejected',
        message: 'Your account registration was not approved. Please contact CITT administration.'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const family = generateTokenFamily();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storeRefreshTokenInDb(user.id, refreshToken, family, refreshExpiresAt);
    await storeRefreshTokenFamily(family, 7 * 24 * 60 * 60);

    logActivity({
      user_id: user.id, user_email: user.email, user_role: user.role,
      action: 'LOGIN', resource: 'users', resource_id: user.id,
      details: { method: 'POST', path: '/api/auth/login' },
      ip_address: req.ip || null,
      user_agent: req.headers['user-agent'] || null,
      status: 'success'
    });

    logger.info('User logged in', { email, userId: user.id });

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, role: user.role, university: user.university,
        college: user.college, year_of_study: user.year_of_study,
        profile_complete: user.profile_complete, created_at: user.created_at
      }
    });
  })
);

/**
 * POST /api/auth/refresh
 * Rotate refresh token - get new access + refresh token pair
 */
app.post('/api/auth/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await rotateRefreshToken(refreshToken);

    if (!tokens) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
  })
);

/**
 * POST /api/auth/logout
 * Blacklist the access token and revoke the refresh token family
 */
app.post('/api/auth/logout',
  authenticateToken,
  validate(refreshTokenSchema.optional()),
  asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];

    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await blacklistToken(hashToken(accessToken), ttl);
          }
        }
      } catch { /* ignore decode errors */ }
    }

    // Revoke refresh token family if provided
    if (req.body.refreshToken) {
      const hash = hashToken(req.body.refreshToken);
      const rtResult = await pool.query(
        'SELECT family FROM refresh_tokens WHERE token = $1',
        [hash]
      );
      if (rtResult.rows.length > 0) {
        await revokeRefreshTokenFamily(rtResult.rows[0].family);
      }
    }

    // Also store blacklisted hash in PostgreSQL as backup
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await pool.query(
            `INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [hashToken(accessToken), expiresAt]
          );
        }
      } catch { /* ignore */ }
    }

    res.json({ message: 'Logged out successfully' });
  })
);

/**
 * POST /api/auth/firebase-register
 * Register/Login via Firebase OAuth
 */
app.post('/api/auth/firebase-register',
  validate(firebaseRegisterSchema),
  asyncHandler(async (req, res) => {
    const { uid, email, displayName, phoneNumber } = req.body;

    const userExists = await pool.query(
      'SELECT * FROM users WHERE firestore_id = $1 OR email = $2',
      [uid, email]
    );

    if (userExists.rows.length > 0) {
      const existingUser = userExists.rows[0];

      if (existingUser.deleted_at) return res.status(401).json({ error: 'Invalid account' });
      if (existingUser.account_status === 'pending') {
        return res.status(403).json({ error: 'account_pending', message: `Hi ${existingUser.name}, your account is awaiting admin approval.` });
      }
      if (existingUser.account_status === 'rejected') {
        return res.status(403).json({ error: 'account_rejected', message: 'Your account was not approved. Contact CITT administration.' });
      }

      const accessToken = generateAccessToken(existingUser);
      const refreshToken = generateRefreshToken();
      const family = generateTokenFamily();
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await storeRefreshTokenInDb(existingUser.id, refreshToken, family, refreshExpiresAt);
      await storeRefreshTokenFamily(family, 7 * 24 * 60 * 60);

      return res.json({
        message: 'User logged in successfully',
        accessToken,
        refreshToken,
        user: existingUser
      });
    }

    const result = await pool.query(
      `INSERT INTO users
       (firestore_id, name, email, phone, password, role, account_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
       RETURNING id, firestore_id, name, email, phone, role, account_status, created_at`,
      [uid, displayName || 'User', email, phoneNumber || null, null, 'innovator']
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Registration successful. Your account is awaiting admin approval.',
      pending: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, account_status: 'pending' }
    });
  })
);

/**
 * POST /api/auth/set-password
 * Set password (for OAuth users who don't have one yet)
 */
app.post('/api/auth/set-password',
  authenticateToken,
  validate(setPasswordSchema),
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userId = req.user?.id;

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role`,
      [hashedPassword, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('Password set', { userId });

    res.json({
      message: 'Password set successfully',
      user: result.rows[0]
    });
  })
);

/**
 * PUT /api/auth/change-password
 * Change password (authenticated)
 */
app.put('/api/auth/change-password',
  authenticateToken,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      'SELECT id, password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(400).json({ error: 'No password set. Use set-password endpoint.' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    logger.info('Password changed', { userId: req.user.id });

    res.json({ message: 'Password changed successfully' });
  })
);

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
app.post('/api/auth/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    await sendPasswordResetEmail(user.email, user.name, resetToken, 30);

    logger.info('Password reset email sent', { email: user.email });
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password using a valid reset token
 */
app.post('/api/auth/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetRecord = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query('BEGIN');
    try {
      await pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, resetRecord.user_id]
      );

      await pool.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
        [resetRecord.id]
      );

      await pool.query('COMMIT');

      // Revoke all existing refresh tokens for this user
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
        [resetRecord.user_id]
      );

      logger.info('Password reset completed', { userId: resetRecord.user_id });

      res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  })
);

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
app.post('/api/auth/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Verification token is required' });

  const result = await pool.query(
    `SELECT id FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW() AND deleted_at IS NULL`,
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }

  await pool.query(
    `UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL, updated_at = NOW() WHERE id = $1`,
    [result.rows[0].id]
  );

  logger.info('Email verified', { userId: result.rows[0].id });
  res.json({ message: 'Email verified successfully. You can now log in once your account is approved.' });
}));

// ============================================
// PROTECTED USER ENDPOINTS
// ============================================

app.get('/api/users', authenticateToken, asyncHandler(async (req, res) => {
  const adminRoles = ['superAdmin', 'admin', 'transferTechnologyOfficer', 'ipManager'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const result = await pool.query(
    `SELECT id, name, email, phone, role, university, campus, account_status, created_at
     FROM users WHERE deleted_at IS NULL
     ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit), offset]
  );
  res.json({ users: result.rows, page: parseInt(page), limit: parseInt(limit) });
}));

app.get('/api/users/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT id, name, email, phone, role, university, college, year_of_study,
            profile_complete, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
}));

app.put('/api/users/:id', authenticateToken,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, campus } = req.body;

  if (req.user.id !== parseInt(id) && !isAdmin(req.user.role)) {
    return res.status(403).json({ error: 'You can only update your own profile' });
  }

  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name), email = COALESCE($2, email),
         phone = COALESCE($3, phone), campus = COALESCE($4, campus), updated_at = NOW()
     WHERE id = $5
     RETURNING id, name, email, phone, role, campus, created_at, updated_at`,
    [name, email, phone, campus || null, id]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
}));

app.delete('/api/users/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== parseInt(id) && !isAdmin(req.user.role)) {
    return res.status(403).json({ error: 'You can only delete your own account' });
  }
  await pool.query(
    `UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  res.json({ message: 'User account deactivated successfully' });
}));

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

app.get('/api/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, title, message, type, read, link, created_at, updated_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(result.rows);
}));

app.put('/api/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const checkResult = await pool.query(
    'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
  await pool.query('UPDATE notifications SET read = true, updated_at = NOW() WHERE id = $1', [id]);
  res.json({ message: 'Notification marked as read' });
}));

app.put('/api/notifications/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'UPDATE notifications SET read = true, updated_at = NOW() WHERE user_id = $1 AND read = false',
    [req.user.id]
  );
  res.json({ message: 'All notifications marked as read', count: result.rowCount });
}));

app.delete('/api/notifications/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
  res.json({ message: 'Notification deleted successfully' });
}));

// ============================================
// SEARCH ENDPOINT
// ============================================

app.get('/api/search', authenticateToken,
  validate(searchQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
  const { keyword } = req.query;
  const searchTerm = `%${keyword.toLowerCase()}%`;

  const [eventsResult, usersResult] = await Promise.all([
    pool.query(
      `SELECT id, title, description, category, location, start_date, created_at, created_by
       FROM events WHERE deleted_at IS NULL
       AND (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1
            OR LOWER(category) LIKE $1 OR LOWER(location) LIKE $1)
       ORDER BY start_date DESC LIMIT 20`,
      [searchTerm]
    ),
    pool.query(
      `SELECT id, name, email, phone, created_at
       FROM users WHERE (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1)
       AND deleted_at IS NULL LIMIT 20`,
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
// MOUNT ROUTES
// ============================================
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/ipmanager', ipManagerRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/workspace', mentorWorkspaceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', milestonesRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

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
  logger.info(`CITT Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
