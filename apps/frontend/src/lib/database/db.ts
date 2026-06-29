import 'server-only';
import { db as drizzleDb, schema } from '@salvemundi/db';
import { Pool } from 'pg';

export const db = drizzleDb;
export { schema };

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const connectionString = process.env.DATABASE_URL || (dbUser && dbPassword && dbHost && dbName ? `postgres://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}` : undefined);

export const pool = new Pool({ connectionString, max: 20 });
