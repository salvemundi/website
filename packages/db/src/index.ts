import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as relations from './relations.js';

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.VPN_IP || process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const connectionString = process.env.DATABASE_URL || (dbUser && dbPassword && dbHost && dbPort && dbName ? `postgres://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}` : undefined);

if (!connectionString) {
    throw new Error('Database connection configuration is incomplete');
}

const client = postgres(connectionString, { prepare: false });
export const fullSchema = { ...schema, ...relations };
export const db = drizzle(client, { schema: fullSchema });

export { client };
export * from './schema.js';
export * from './relations.js';
export { fullSchema as schema };
export * from 'drizzle-orm';