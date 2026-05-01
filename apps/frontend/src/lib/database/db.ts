import 'server-only';
import { Pool, type QueryResult } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

// Declare global variable to hold the pool instance across hot-reloads
declare global {
    var _pgPool: Pool | undefined;
}

const poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST!,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    max: 20, // Max 20 clients in the pool
    idleTimeoutMillis: 30000,
};

// Use global cache in development to prevent connection exhaustion during hot-reloads
if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool(poolConfig);
    globalThis._pgPool.on('error', (err) => {
        console.error('[DB-Pool] Unexpected error on idle client', err);
    });
}

export const pool = globalThis._pgPool;

export async function query(text: string, params?: (string | number | boolean | null | undefined | object)[], retries = 2): Promise<QueryResult> {
    const start = Date.now();
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            // console.debug(`[DB-Query] Executed in ${duration}ms`, { text, rows: res.rowCount });
            return res;
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : '';
            const errorCode = (e as { code?: string })?.code;
            const isConnectionError = errorMessage.includes('Connection terminated unexpectedly') || errorCode === 'ECONNRESET';
            if (isConnectionError && i < retries) {
                console.warn(`[DB-Query] Connection error, retrying... (${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                continue;
            }
            console.error('[DB-Query Error]', {
                message: e instanceof Error ? e.message : 'Unknown error',
                text,
                // params removed for security
            });
            throw e;
        }
    }
    throw new Error('[DB-Query] Unexpected end of function');
}

export default pool;
