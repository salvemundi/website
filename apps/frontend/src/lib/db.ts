import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

// Gebruik de interne Docker host en credentials van Directus/VPS
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

pool.on('error', (err) => {
    console.error('[DB-Pool] Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // console.debug(`[DB-Query] Executed in ${duration}ms`, { text, rows: res.rowCount });
        return res;
    } catch (e) {
        console.error('[DB-Query] Error:', e);
        throw e;
    }
}

export default pool;
