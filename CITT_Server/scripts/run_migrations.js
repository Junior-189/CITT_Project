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

function stripCodeFences(sql) {
  // Remove leading/trailing triple-backtick code fences if present
  if (!sql) return sql;
  // Trim leading/trailing whitespace
  let s = sql.trim();
  if (s.startsWith('```')) {
    // remove first line if it's a code fence
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
    // ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const name = file;
      const check = await client.query('SELECT name FROM migrations WHERE name = $1', [name]);
      if (check.rows.length > 0) {
        console.log(`Skipping already applied migration: ${name}`);
        continue;
      }

      const fullPath = path.join(MIGRATIONS_DIR, file);
      console.log(`Applying migration: ${name}`);
      let sql = fs.readFileSync(fullPath, 'utf8');
      sql = stripCodeFences(sql);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        console.log(`Applied migration: ${name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration ${name}:`, err.message || err);
        throw err;
      }
    }

    console.log('Migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
