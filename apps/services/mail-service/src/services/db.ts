import pkg from 'pg';
import { Kysely, PostgresDialect, type Generated } from 'kysely';
import { Directus } from '@salvemundi/validations';
import { safeConsoleError } from '../utils/logger.js';

const { Pool } = pkg;

type KyselyDbSchema<Schema, GeneratedWrapper> = {
    [Table in keyof Schema]: Schema[Table] extends readonly unknown[]
        ? {
            [Field in keyof Schema[Table][number] as Exclude<Schema[Table][number][Field], null> extends readonly unknown[] ? never : Field]: Field extends 'id'
                ? Schema[Table][number][Field] extends number
                    ? GeneratedWrapper
                    : Schema[Table][number][Field]
                : Schema[Table][number][Field];
          }
        : never;
};

type Db = KyselyDbSchema<Directus.Schema, Generated<number>>;

export interface Database {
    pub_crawl_tickets: Db['pub_crawl_tickets'];
    pub_crawl_signups: Db['pub_crawl_signups'];
    pub_crawl_events: Db['pub_crawl_events'];
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