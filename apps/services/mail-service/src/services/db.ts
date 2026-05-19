import pkg from 'pg';
const { Pool } = pkg;
import { Kysely, PostgresDialect } from 'kysely';
import { type DirectusSchema } from '@salvemundi/validations';

export interface Database {
    pub_crawl_tickets: DirectusSchema['pub_crawl_tickets'][number];
    pub_crawl_signups: DirectusSchema['pub_crawl_signups'][number];
    pub_crawl_events: DirectusSchema['pub_crawl_events'][number];
}

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

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool
    })
});

export default pool;
