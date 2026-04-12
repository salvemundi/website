import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

pool.on('error', (err) => {
    console.error('[DB-Plugin] Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // console.debug(`[DB-Query] Executed in ${duration}ms`, { text, rows: res.rowCount });
        return res;
    } catch (e) {
        console.error('[DB-Query Error]', {
            message: e instanceof Error ? e.message : 'Unknown error',
            text,
            params,
        });
        throw e;
    }
}

export default pool;
