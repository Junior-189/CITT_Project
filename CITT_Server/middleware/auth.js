/**
 * Authentication Middleware
 * Purpose: Verify JWT tokens and extract user information
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Verify JWT token and add user to request
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies the token is valid
 * 3. Fetches fresh user data from database (including role)
 * 4. Adds user object to req.user for next middleware
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from database (including role)
    // This ensures role is always up-to-date even if it was changed by admin
    const result = await pool.query(
      'SELECT id, email, role, name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user to request object
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      name: result.rows[0].name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Use this for routes that work differently for logged-in vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, role, name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length > 0) {
      req.user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
        name: result.rows[0].name
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just treat as not logged in
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
