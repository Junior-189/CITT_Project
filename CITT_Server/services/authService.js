const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const userRepository = require('../repositories/userRepository');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../middleware/auditLog');
const { storeRefreshTokenFamily } = require('../services/redis');
const logger = require('../config/logger');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const authService = {
  register: async (userData) => {
    const { name, email, password, phone, university, campus, college,
            year_of_study, firestore_id } = userData;

    const existing = await userRepository.findByEmail(email);
    if (existing) throw { status: 409, message: 'User with this email already exists' };

    if (firestore_id) {
      const fb = await userRepository.findByFirestoreId(firestore_id);
      if (fb) throw { status: 409, message: 'User with this firestore_id already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      name, email, password: hashedPassword, phone, role: 'innovator',
      university, campus, college, year_of_study, firestore_id,
    });

    logger.info('User registered', { email, userId: user.id });
    return user;
  },

  login: async (email, password) => {
    const user = await userRepository.findByEmail(email);
    if (!user || user.deleted_at) throw { status: 401, message: 'Invalid email or password' };

    if (user.account_status === 'pending') {
      throw { status: 403, message: 'account_pending', detail: `Hi ${user.name}, your account is awaiting admin approval.` };
    }
    if (user.account_status === 'rejected') {
      throw { status: 403, message: 'account_rejected', detail: 'Your account registration was not approved.' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw { status: 401, message: 'Invalid email or password' };

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const family = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, family, expires_at) VALUES ($1,$2,$3,$4)`,
      [user.id, hashToken(refreshToken), family, expiresAt]
    );
    await storeRefreshTokenFamily(family, 7 * 24 * 60 * 60);

    logActivity({
      user_id: user.id, user_email: user.email, user_role: user.role,
      action: 'LOGIN', resource: 'users', resource_id: user.id,
      details: { method: 'POST' }, ip_address: null, user_agent: null, status: 'success'
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, university: user.university, college: user.college,
        year_of_study: user.year_of_study, profile_complete: user.profile_complete,
        created_at: user.created_at,
      },
    };
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await userRepository.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    const result = await userRepository.changePassword(userId, currentPassword, newPassword);
    if (!result.success) throw { status: 401, message: result.error };

    logger.info('Password changed', { userId });
    return { message: 'Password changed successfully' };
  },

  setPassword: async (userId, password) => {
    const hashed = await bcrypt.hash(password, 12);
    await userRepository.updatePassword(userId, hashed);
    logger.info('Password set', { userId });
    return { message: 'Password set successfully' };
  },

  approveAccount: async (userId, approvedBy) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const user = await userRepository.approveAccount(userId, approvedBy);
      if (!user) {
        await client.query('ROLLBACK');
        throw { status: 404, message: 'User not found' };
      }

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, read, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [userId, 'Account Approved',
         'Your CITT account has been approved. You can now log in and access the system.',
         'account_approved', '/login']
      );

      await client.query('COMMIT');
      return { user, message: `${user.name} approved successfully` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  rejectAccount: async (userId, approvedBy, reason) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const user = await userRepository.rejectAccount(userId, approvedBy, reason);
      if (!user) {
        await client.query('ROLLBACK');
        throw { status: 404, message: 'User not found' };
      }

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, read, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [userId, 'Account Rejected',
         `Your CITT account registration has been rejected. Reason: ${reason || 'Not specified'}`,
         'account_rejected', '/login']
      );

      await client.query('COMMIT');
      return { user, message: `${user.name} rejected` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = authService;
