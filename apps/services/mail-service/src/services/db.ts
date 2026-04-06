import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'v7-core-db',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

pool.on('error', (err) => {
    console.error('[DB-Pool] Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DB-Query] Executed in ${duration}ms`, { rowCount: res.rowCount });
        }
        return res;
    } catch (e) {
        console.error('[DB-Query] Error:', e);
        throw e;
    }
}

export default pool;
