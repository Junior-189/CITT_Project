/**
 * CITT RBAC System - Test Account Creator
 * Purpose: Create test accounts for all 11 roles
 * Usage: node scripts/createTestAccounts.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test accounts configuration
const testAccounts = [
  {
    name: 'CITT Super Administrator',
    email: 'superadmin@citt.ac.tz',
    password: 'SuperAdmin@2025',
    phone: '+255700000001',
    role: 'superAdmin',
    university: 'CITT',
    college: 'Administration',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'John Admin',
    email: 'admin@citt.ac.tz',
    password: 'Admin@2025',
    phone: '+255700000002',
    role: 'admin',
    university: 'CITT',
    college: 'Innovation Department',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'Tech Transfer Officer',
    email: 'tto@citt.ac.tz',
    password: 'TTOfficer@2025',
    phone: '+255700000003',
    role: 'transferTechnologyOfficer',
    university: 'CITT',
    college: 'Technology Transfer',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'Mary IP Manager',
    email: 'ipmanager@citt.ac.tz',
    password: 'IPManager@2025',
    phone: '+255700000004',
    role: 'ipManager',
    university: 'CITT',
    college: 'IP Management Department',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'DII Director',
    email: 'diidirector@citt.ac.tz',
    password: 'DiiDirector@2025',
    phone: '+255700000005',
    role: 'diiDirector',
    university: 'CITT',
    college: 'Incubation & Innovation',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'DEBM Director',
    email: 'debmdirector@citt.ac.tz',
    password: 'DebmDirector@2025',
    phone: '+255700000006',
    role: 'debmDirector',
    university: 'CITT',
    college: 'Entrepreneurship & Business',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'RTP Director',
    email: 'rtpdirector@citt.ac.tz',
    password: 'RtpDirector@2025',
    phone: '+255700000007',
    role: 'rtpDirector',
    university: 'CITT',
    college: 'Rural Technology Promotion',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'David Mentor',
    email: 'mentor@citt.ac.tz',
    password: 'Mentor@2025',
    phone: '+255700000008',
    role: 'mentor',
    university: 'CITT',
    college: 'Mentorship Programme',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'TC Evaluator',
    email: 'tc@citt.ac.tz',
    password: 'TechCommittee@2025',
    phone: '+255700000009',
    role: 'technicalCommittee',
    university: 'CITT',
    college: 'Technical Committee',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'Sarah Coordinator',
    email: 'coordinator@citt.ac.tz',
    password: 'Coordinator@2025',
    phone: '+255700000010',
    role: 'coordinator',
    university: 'CITT',
    college: 'Project Coordination',
    year_of_study: null,
    profile_complete: true
  },
  {
    name: 'Alice Innovator',
    email: 'innovator@citt.ac.tz',
    password: 'Innovator@2025',
    phone: '+255700000011',
    role: 'innovator',
    university: 'University of Dar es Salaam',
    college: 'College of Engineering',
    year_of_study: 3,
    profile_complete: true
  }
];

/**
 * Create a single test account
 */
async function createAccount(account) {
  try {
    // Check if account already exists
    const existing = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [account.email]
    );

    if (existing.rows.length > 0) {
      console.log(`   ⚠️  Account already exists: ${account.email} (${existing.rows[0].role})`);
      return existing.rows[0];
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(account.password, 12);

    // Insert account
    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, phone, role, university, college, year_of_study, profile_complete, account_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', NOW(), NOW())
       RETURNING id, name, email, role`,
      [
        account.name,
        account.email,
        hashedPassword,
        account.phone,
        account.role,
        account.university,
        account.college,
        account.year_of_study,
        account.profile_complete
      ]
    );

    console.log(`   ✅ Created: ${account.email} (${account.role})`);
    return result.rows[0];
  } catch (error) {
    console.error(`   ❌ Error creating ${account.email}:`, error.message);
    throw error;
  }
}

/**
 * Main function to create all test accounts
 */
async function createAllTestAccounts() {
  console.log('============================================');
  console.log('🚀 CITT Test Account Creator');
  console.log('============================================');
  console.log('');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Database connected successfully');
    console.log('');

    // Check if role column exists
    console.log('🔍 Checking database schema...');
    const columnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('   ❌ ERROR: Role column does not exist in users table');
      console.log('   📝 Please run migrate-roles.sql first:');
      console.log('      psql -U citt_users -d citt_db -f scripts/migrate-roles.sql');
      process.exit(1);
    }
    console.log('   ✅ Database schema is ready');
    console.log('');

    // Create test accounts
    console.log('👥 Creating test accounts...');
    console.log('');

    const createdAccounts = [];
    for (const account of testAccounts) {
      const created = await createAccount(account);
      createdAccounts.push({ ...account, id: created.id });
    }

    console.log('');
    console.log('============================================');
    console.log('✅ Test Account Creation Complete!');
    console.log('============================================');
    console.log('');
    console.log('📋 Test Account Credentials:');
    console.log('');

    // Display credentials in a formatted table
    testAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.role.toUpperCase()}`);
      console.log(`   Email:    ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   Name:     ${account.name}`);
      console.log('');
    });

    console.log('============================================');
    console.log('⚠️  SECURITY REMINDERS:');
    console.log('============================================');
    console.log('1. These are TEST accounts - change passwords in production!');
    console.log('2. SuperAdmin password should be changed immediately');
    console.log('3. Delete or disable test accounts before going live');
    console.log('4. Use strong passwords in production');
    console.log('');

    // Display role statistics
    console.log('📊 User Role Statistics:');
    const roleStats = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY
        CASE role
          WHEN 'superAdmin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'transferTechnologyOfficer' THEN 3
          WHEN 'ipManager' THEN 4
          WHEN 'diiDirector' THEN 5
          WHEN 'debmDirector' THEN 6
          WHEN 'rtpDirector' THEN 7
          WHEN 'mentor' THEN 8
          WHEN 'technicalCommittee' THEN 9
          WHEN 'coordinator' THEN 10
          WHEN 'innovator' THEN 11
        END
    `);

    roleStats.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.count} user(s)`);
    });
    console.log('');

    console.log('🎯 Next Steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Test login with any of the accounts above');
    console.log('3. Verify role-based access control is working');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Fatal Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Verify .env file has correct database credentials');
    console.error('3. Run migrate-roles.sql before creating accounts');
    console.error('4. Check database connection settings');
    console.error('');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createAllTestAccounts();
}

module.exports = { createAllTestAccounts, testAccounts };
