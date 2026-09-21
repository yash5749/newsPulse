#!/usr/bin/env node
/**
 * Database initialization script for News Pulse.
 * Creates tables and seeds initial RSS sources.
 * Safe to run multiple times (idempotent).
 * Usage: npm run db:init (or npx tsx src/db/init.ts)
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL!,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runSql(sql: string, description: string) {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`✓ ${description}`);
  } catch (error) {
    console.error(`✗ ${description}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

const SCHEMA_SQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
const SEED_SQL = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');

async function main() {
  console.log('Initializing News Pulse database...');
  console.log(`Database: ${DATABASE_URL!.replace(/:[^:@]+@/, ':****@')}`);

  await runSql(SCHEMA_SQL, 'Creating tables');
  await runSql(SEED_SQL, 'Seeding RSS sources');

  console.log('Database initialization complete!');
  await pool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('Initialization failed:', error);
  process.exit(1);
});