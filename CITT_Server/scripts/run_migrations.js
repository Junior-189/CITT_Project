#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'citt'
});

const IDEMPOTENT_ERROR_CODES = new Set([
  '42710', // duplicate_object
  '42P07', // duplicate_table
  '42701', // duplicate_column
  '42P16', // duplicate_table (invalid table definition)
  '23505', // unique_violation (e.g. constraint/index already exists)
]);

function isIdempotentError(err) {
  // Check Postgres error code
  if (err.code && IDEMPOTENT_ERROR_CODES.has(err.code)) return true;
  // Check for "already exists" pattern in message
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('already exists')) return true;
  if (msg.includes('duplicate key') || msg.includes('duplicate column')) return true;
  return false;
}

function stripCodeFences(sql) {
  if (!sql) return sql;
  let s = sql.trim();
  if (s.startsWith('```')) {
    const lines = s.split(/\r?\n/);
    if (lines[0].startsWith('```')) lines.shift();
    if (lines[lines.length - 1].startsWith('```')) lines.pop();
    s = lines.join('\n');
  }
  return s;
}

async function run() {
  console.log('Running migrations from', MIGRATIONS_DIR);
  const client = await pool.connect();
  try {
    // Ensure schema_migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Backfill schema_migrations from legacy migrations table
    try {
      const legacyExists = await client.query(
        `SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'migrations')`
      );
      if (legacyExists.rows[0].exists) {
        await client.query(
          `INSERT INTO schema_migrations (name, applied_at)
           SELECT m.name, m.applied_at FROM migrations m
           WHERE NOT EXISTS (SELECT 1 FROM schema_migrations sm WHERE sm.name = m.name)`
        );
        const count = await client.query('SELECT COUNT(*) FROM schema_migrations');
        console.log(`Backfilled schema_migrations — ${count.rows[0].count} total tracked`);
      }
    } catch (e) {
      console.log('Backfill skipped:', e.message);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let totalApplied = 0;
    let totalSkipped = 0;
    let totalWarned = 0;

    for (const file of files) {
      const name = file;
      const check = await client.query('SELECT name FROM schema_migrations WHERE name = $1', [name]);
      if (check.rows.length > 0) {
        console.log(`Skipping already applied migration: ${name}`);
        totalSkipped++;
        continue;
      }

      const fullPath = path.join(MIGRATIONS_DIR, file);
      console.log(`Applying migration: ${name}`);
      let sql = fs.readFileSync(fullPath, 'utf8');
      sql = stripCodeFences(sql);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
        await client.query('COMMIT');
        console.log(`Applied migration: ${name}`);
        totalApplied++;
      } catch (err) {
        await client.query('ROLLBACK');
        if (isIdempotentError(err)) {
          console.warn(`ALREADY EXISTS (safe): migration ${name} — ${err.message} — marking as applied`);
          try {
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
          } catch (insErr) {
            console.warn(`Could not record migration ${name}: ${insErr.message}`);
          }
          totalWarned++;
        } else {
          console.error(`Failed to apply migration ${name}:`, err.message || err);
          throw err;
        }
      }
    }

    console.log(`\nMigration complete: ${totalApplied} applied, ${totalSkipped} skipped, ${totalWarned} warnings (idempotent)`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
