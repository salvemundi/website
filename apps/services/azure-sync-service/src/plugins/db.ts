import { Kysely, PostgresDialect, type Generated } from 'kysely';
import pg from 'pg';
import { type DirectusSchema } from '@salvemundi/validations';
import { safeConsoleError } from '../utils/logger.js';

const { Pool } = pg;

export interface Database {
    directus_users: DirectusSchema['directus_users'][number];
    system_logs: {
        id: Generated<number>;
        type: string;
        status: string;
        payload: string;
        created_at: Generated<string>;
    };
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
        pool,
    }),
});

export default pool;