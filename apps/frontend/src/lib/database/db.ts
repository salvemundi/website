import 'server-only';
import { db as drizzleDb, schema } from '@salvemundi/db';
import { Pool } from 'pg';
import { safeConsoleError } from '@/server/utils/logger';

export const db = drizzleDb;
export { schema };

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const connectionString = process.env.DATABASE_URL || 
    (dbUser && dbPassword && dbHost && dbName 
        ? `postgres://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}` 
        : undefined);

const globalForPool = globalThis as unknown as {
    pool: Pool | undefined;
};

export const pool = globalForPool.pool ?? new Pool({ 
    connectionString, 
    max: process.env.NODE_ENV === 'production' ? 20 : 2 
});

if (!globalForPool.pool) {
    pool.on('error', (err: Error) => {
        safeConsoleError('[db.ts][pg Pool Error] Unexpected error on idle client', err);
    });

    const originalQuery = pool.query.bind(pool);

    pool.query = (function(this: Pool, ...args: unknown[]): unknown {
        const res = (originalQuery as (...queryArgs: unknown[]) => unknown)(...args);

        if (res instanceof Promise) {
            return (res as Promise<unknown>).catch((err: unknown) => {
                const errMsg = err instanceof Error ? err.message : String(err);
                safeConsoleError(`[db.ts][pg Pool Query Error] SQL Error: ${errMsg}`, { 
                    query: args[0], 
                    error: err 
                });
                throw err instanceof Error ? err : new Error(String(err));
            });
        }

        return res;
    }) as unknown as Pool['query'];
}

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;