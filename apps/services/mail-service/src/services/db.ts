import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'v7-core-db',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

pool.on('error', (_err) => {
    // Silent error handler for idle clients to prevent service crash.
});

export async function query(text: string, params?: any[]) {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (e) {
        throw e;
    }
}

export default pool;
