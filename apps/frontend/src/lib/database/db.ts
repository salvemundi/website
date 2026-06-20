import 'server-only';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { safeConsoleError, logWarn } from '@/server/utils/logger';

declare global {
    var _pgPool: Pool | undefined;
}

const poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    max: 20,
    idleTimeoutMillis: 30000
};

if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool(poolConfig);
    globalThis._pgPool.on('error', (error) => {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('db.ts][poolOnError]', `Unexpected error on idle client: ${typedError.message}`);
    });
}

export const pool = globalThis._pgPool;

export async function query<R extends QueryResultRow = QueryResultRow>(text: string, params?: (string | number | boolean | null | undefined | object)[], retries = 2): Promise<QueryResult<R>> {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await pool.query(text, params);
            return res;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '';
            const errorCode = (error as { code?: string }).code;
            const isConnectionError = errorMessage.includes('Connection terminated unexpectedly') || errorCode === 'ECONNRESET';
            if (isConnectionError && i < retries) {
                logWarn('db.ts][query]', `Connection error, retrying... (${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                continue;
            }
            interface PgError {
                detail?: string;
                hint?: string;
            }
            const pgError = error as PgError;

            safeConsoleError('db.ts][query]', `DB-Query Error: ${errorMessage} (Code: ${errorCode}). Query: ${text}. Detail: ${pgError.detail ?? ''}. Hint: ${pgError.hint ?? ''}`);

            if (process.env.DB_USER === 'dummy') {
                logWarn('db.ts][query]', 'Build-time DB connection failure detected. Returning empty result.');
                return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
            }

            throw error;
        }
    }
    throw new Error('db.ts][query] Unexpected end of function');
}