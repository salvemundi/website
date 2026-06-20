import pkg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { type DirectusSchema } from '@salvemundi/validations';
import { safeConsoleError } from '../utils/logger.js';

const { Pool } = pkg;

export interface Database {
    pub_crawl_tickets: DirectusSchema['pub_crawl_tickets'][number];
    pub_crawl_signups: DirectusSchema['pub_crawl_signups'][number];
    pub_crawl_events: DirectusSchema['pub_crawl_events'][number];
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

pool.on('error', (error: unknown) => {
    const typedError = error instanceof Error ? error : new Error(String(error));
    safeConsoleError('db.ts][poolOnError]', `Postgres pool idle client error: ${typedError.message}`);
});

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool
    })
});

export default pool;