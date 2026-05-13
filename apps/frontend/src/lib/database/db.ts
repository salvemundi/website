import 'server-only';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { safeConsoleError } from '@/server/utils/logger';



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
    idleTimeoutMillis: 30000
};

// Use global cache in development to prevent connection exhaustion during hot-reloads
if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool(poolConfig);
    globalThis._pgPool.on('error', (error) => {
        safeConsoleError('[DB-Pool] Unexpected error on idle client', error);
    });
}

export const pool = globalThis._pgPool;

export async function query<R extends QueryResultRow = QueryResultRow>(text: string, params?: (string | number | boolean | null | undefined | object)[], retries = 2): Promise<QueryResult<R>> {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await pool.query(text, params);
            // console.debug(`[DB-Query] Executed in ${duration}ms`, { text, rows: res.rowCount });
            return res;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '';
            const errorCode = (error as { code?: string })?.code;
            const isConnectionError = errorMessage.includes('Connection terminated unexpectedly') || errorCode === 'ECONNRESET';
            if (isConnectionError && i < retries) {
                console.warn(`[DB-Query] Connection error, retrying... (${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                continue;
            }
            interface PgError {
                detail?: string;
                hint?: string;
            }
            const pgError = error as PgError;

            safeConsoleError('[DB-Query Error]', {
                message: errorMessage,
                code: errorCode,
                text,
                detail: pgError.detail,
                hint: pgError.hint
            });

            if (process.env.DB_USER === 'dummy') {
                console.warn('[DB-Query] Build-time DB connection failure detected. Returning empty result.');
                return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
            }

            throw error;
        }
    }
    throw new Error('[DB-Query] Unexpected end of function');
}


