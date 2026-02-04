#!/usr/bin/env node
/**
 * Seed script for Supabase database
 * Usage: node scripts/seed.mjs <database-password>
 *
 * Get your database password from:
 * Supabase Dashboard > Project Settings > Database > Connection string > Password
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'oyehtjtycfmsqfsdncma';
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/seed.mjs <database-password>');
  console.error('');
  console.error('Get your database password from:');
  console.error('Supabase Dashboard > Project Settings > Database > Connection string');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${PROJECT_REF}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function seed() {
  const client = new pg.Client({ connectionString });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected!');

    // Read seed file
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    console.log('Running seed data...');
    await client.query(seedSQL);

    console.log('✅ Seed data applied successfully!');

    // Verify data
    const outcomes = await client.query('SELECT COUNT(*) FROM outcomes');
    const experiments = await client.query('SELECT COUNT(*) FROM experiments');
    const tasks = await client.query('SELECT COUNT(*) FROM tasks');

    console.log('');
    console.log('Data summary:');
    console.log(`  - Outcomes: ${outcomes.rows[0].count}`);
    console.log(`  - Experiments: ${experiments.rows[0].count}`);
    console.log(`  - Tasks: ${tasks.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
