import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as relations from './relations.js';

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST || process.env.VPN_IP;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const connectionString = process.env.DATABASE_URL || (dbUser && dbPassword && dbHost && dbPort && dbName ? `postgres://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}` : undefined);

if (!connectionString) {
    throw new Error('Database connection configuration is incomplete');
}

const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const client = globalForDb.conn ?? postgres(connectionString, { 
    prepare: false, 
    max: process.env.NODE_ENV === 'production' ? 10 : 2 
});
if (process.env.NODE_ENV !== 'production') globalForDb.conn = client;

export const fullSchema = { ...schema, ...relations };
export const db = drizzle(client, { schema: fullSchema });

export { client };
export * from './schema.js';
export * from './relations.js';
export { fullSchema as schema };
export * from 'drizzle-orm';