const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Run migrations before tests
beforeAll(async () => {
  try {
    // Create essential tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'innovator',
        university VARCHAR(255),
        campus VARCHAR(255),
        college VARCHAR(255),
        year_of_study VARCHAR(50),
        profile_complete BOOLEAN DEFAULT FALSE,
        profile_photo_url TEXT,
        firestore_id VARCHAR(255),
        account_status VARCHAR(50) DEFAULT 'pending',
        approved_by_admin INTEGER,
        approved_at TIMESTAMP,
        approval_rejection_reason TEXT,
        deleted_at TIMESTAMP,
        deleted_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        institution VARCHAR(255),
        funding_needed DECIMAL(15,2) DEFAULT 0,
        problem_statement TEXT,
        approval_status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        project_status VARCHAR(50) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS funding (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'TZS',
        grant_type VARCHAR(50) DEFAULT 'research',
        approval_status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        funding_status VARCHAR(50) DEFAULT 'applied',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        action VARCHAR(255),
        resource VARCHAR(100),
        resource_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50),
        link VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error('Test setup error:', error.message);
  }
});

// Clean up test data after all tests
afterAll(async () => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test%@test.com']);
    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM funding');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@test.com']);
  } catch (error) {
    console.error('Test cleanup error:', error.message);
  }
  await pool.end();
});

// Helper to create test user
global.createTestUser = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash(overrides.password || 'Test@1234', 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, account_status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      overrides.name || 'Test User',
      overrides.email || `test${Date.now()}@test.com`,
      hashedPassword,
      overrides.role || 'innovator',
      overrides.account_status || 'approved',
    ]
  );
  return result.rows[0];
};

global.app = require('../server');
