#!/usr/bin/env node
/**
 * One-time data migration: copy existing IP records from Firestore → PostgreSQL
 *
 * Run once with: node scripts/migrate-ip-from-firestore.js
 *
 * Prerequisites:
 *   - Firebase Admin service account JSON at GOOGLE_APPLICATION_CREDENTIALS env var
 *   - Migration 023 already applied (ip_documents, ip_status_history, etc.)
 *   - firestore_id column exists on ip_management (added by migration 023)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let firestoreAvailable = false;
try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
    firestoreAvailable = true;
    console.log('Firebase Admin SDK initialized');
  } else {
    console.log('No GOOGLE_APPLICATION_CREDENTIALS found — skipping Firestore migration');
  }
} catch (e) {
  console.log('Firebase Admin init failed — skipping Firestore migration:', e.message);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'citt',
});

const migrationStats = { total: 0, migrated: 0, skipped: 0, failed: 0, noUser: 0 };

async function getPgUserId(firestoreUid) {
  const res = await pool.query('SELECT id FROM users WHERE firestore_id = $1 AND deleted_at IS NULL LIMIT 1', [firestoreUid]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

async function ipExistsByOrigin(firestoreId) {
  if (!firestoreId) return false;
  const res = await pool.query('SELECT id FROM ip_management WHERE firestore_id = $1 LIMIT 1', [firestoreId]);
  return res.rows.length > 0;
}

async function migrateIPRecords() {
  if (!firestoreAvailable) {
    console.log('Firestore not available. Exiting.');
    await pool.end();
    return;
  }

  const db = getFirestore();
  console.log('Reading IPs from Firestore...');

  let snapshot;
  try {
    snapshot = await db.collection('ips').get();
  } catch (e) {
    console.log('Firestore "ips" collection not found or inaccessible:', e.message);
    await pool.end();
    return;
  }

  migrationStats.total = snapshot.size;
  console.log(`Found ${snapshot.size} IP records in Firestore`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const firestoreId = doc.id;

    try {
      // Check if already migrated
      if (await ipExistsByOrigin(firestoreId)) {
        migrationStats.skipped++;
        continue;
      }

      // Find the PostgreSQL user
      const pgUserId = await getPgUserId(data.uid);
      if (!pgUserId) {
        console.log(`  SKIP: No PostgreSQL user found for Firestore UID "${data.uid}" (IP: ${data.title || firestoreId})`);
        migrationStats.noUser++;
        continue;
      }

      // Map Firestore fields to PostgreSQL columns
      const title = data.title || data.ipTitle || '';
      const ipType = data.ipType || '';
      const inventors = data.inventors || '';
      const abstract = data.abstract || '';
      const field = data.field || '';
      const milestoneStage = data.milestone_stage || null;
      const priorArt = data.priorArt || null;
      const status = data.status || 'Submitted';

      // Determine approval_status from status
      let approvalStatus = 'pending';
      if (['Patent Granted', 'Granted', 'Published'].includes(status)) {
        approvalStatus = 'approved';
      } else if (status === 'Rejected') {
        approvalStatus = 'rejected';
      }

      // Identification numbers (flat or nested)
      const ids = data.identificationNumbers || {};
      const patentNumber = ids.patentNumber || data.patentNo || null;
      const applicationNumber = ids.applicationNumber || null;
      const trademarkRegNumber = ids.trademarkRegNumber || null;
      const trademarkClassification = ids.trademarkClassification || null;
      const copyrightRegNumber = ids.copyrightRegNumber || null;
      const copyrightType = ids.copyrightType || null;
      const designRegNumber = ids.designRegNumber || null;
      const designClassification = ids.designClassification || null;

      // Use Firestore created timestamp, fall back to NOW()
      let createdAt = new Date();
      if (data.createdAt) {
        if (data.createdAt.toDate) createdAt = data.createdAt.toDate();
        else if (data.createdAt._seconds) createdAt = new Date(data.createdAt._seconds * 1000);
      }

      // Insert into PostgreSQL
      const result = await pool.query(
        `INSERT INTO ip_management
          (user_id, created_by, firestore_id, ip_type, title, inventors, abstract, field,
           milestone_stage, prior_art, status, approval_status,
           patent_number, application_number, trademark_reg_number, trademark_classification,
           copyright_reg_number, copyright_type, design_reg_number, design_classification,
           created_at, updated_at)
         VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
         RETURNING id`,
        [pgUserId, firestoreId, ipType, title, inventors, abstract, field,
         milestoneStage, priorArt, status, approvalStatus,
         patentNumber, applicationNumber, trademarkRegNumber, trademarkClassification,
         copyrightRegNumber, copyrightType, designRegNumber, designClassification,
         createdAt]
      );
      const newIpId = result.rows[0].id;

      // Migrate file URLs as ip_documents (they're URLs, not actual files)
      const files = data.files || [];
      for (const file of files) {
        if (file.url && file.name) {
          await pool.query(
            `INSERT INTO ip_documents (ip_id, file_name, file_url, uploaded_by, created_at)
             VALUES ($1,$2,$3,$4,$5)`,
            [newIpId, file.name, file.url, pgUserId, createdAt]
          );
        }
      }

      // Insert initial status history
      await pool.query(
        `INSERT INTO ip_status_history (ip_id, old_status, new_status, changed_by, note, created_at)
         VALUES ($1, NULL, $2, $3, 'Migrated from Firestore', $4)`,
        [newIpId, status, pgUserId, createdAt]
      );

      migrationStats.migrated++;
      if (migrationStats.migrated % 10 === 0) {
        console.log(`  Migrated ${migrationStats.migrated}/${migrationStats.total}...`);
      }
    } catch (err) {
      console.error(`  ERROR migrating IP "${data.title || firestoreId}": ${err.message}`);
      migrationStats.failed++;
    }
  }

  console.log('\n--- Migration Results ---');
  console.log(`  Total Firestore records: ${migrationStats.total}`);
  console.log(`  Migrated:              ${migrationStats.migrated}`);
  console.log(`  Skipped (already):     ${migrationStats.skipped}`);
  console.log(`  No matching user:      ${migrationStats.noUser}`);
  console.log(`  Failed:                ${migrationStats.failed}`);

  await pool.end();
}

migrateIPRecords().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
