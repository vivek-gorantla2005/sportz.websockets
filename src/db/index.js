import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the .env file');
}

/**
 * Configure the Postgres connection pool
 */
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add some sensible defaults for a high-concurrency app
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * Initialize Drizzle with our schema for full type-safety and relation support
 */
export const db = drizzle(pool, { schema });

console.log('🐘 Database client initialized');
