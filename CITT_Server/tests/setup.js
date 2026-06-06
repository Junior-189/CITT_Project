const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Create essential tables (inline, no hooks needed in setupFiles)
pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password TEXT, phone VARCHAR(50), role VARCHAR(50) DEFAULT 'innovator', university VARCHAR(255), campus VARCHAR(255), college VARCHAR(255), year_of_study VARCHAR(50), profile_complete BOOLEAN DEFAULT FALSE, profile_photo_url TEXT, firestore_id VARCHAR(255), account_status VARCHAR(50) DEFAULT 'pending', approved_by_admin INTEGER, approved_at TIMESTAMP, approval_rejection_reason TEXT, deleted_at TIMESTAMP, deleted_by INTEGER, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`).catch(() => {});

pool.query(`CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title VARCHAR(255) NOT NULL, description TEXT, category VARCHAR(100), institution VARCHAR(255), funding_needed DECIMAL(15,2) DEFAULT 0, problem_statement TEXT, approval_status VARCHAR(50) DEFAULT 'pending', rejection_reason TEXT, approved_by INTEGER, approved_at TIMESTAMP, project_status VARCHAR(50) DEFAULT 'submitted', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`).catch(() => {});

pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER, user_email VARCHAR(255), user_role VARCHAR(50), action VARCHAR(255), resource VARCHAR(100), resource_id INTEGER, details JSONB, ip_address VARCHAR(45), user_agent TEXT, status VARCHAR(50) DEFAULT 'success', created_at TIMESTAMP DEFAULT NOW())`).catch(() => {});

pool.query(`CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR(255), message TEXT, type VARCHAR(50), link VARCHAR(255), read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`).catch(() => {});

// Global helpers
global.createTestUser = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash(overrides.password || 'Test@1234', 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, account_status) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [overrides.name || 'Test User', overrides.email || `test${Date.now()}@test.com`, hashedPassword, overrides.role || 'innovator', overrides.account_status || 'approved']
  );
  return result.rows[0];
};

global.app = require('../server');
global.pool = pool;
