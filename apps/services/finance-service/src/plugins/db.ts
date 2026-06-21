import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from 'pg';
import { Kysely, PostgresDialect, type Generated } from 'kysely';
import { type Schema } from '@salvemundi/validations';

const { Pool } = pg;

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

type Db = KyselyDbSchema<Schema, Generated<number>>;

export interface Database {
    transactions: Db['transactions'];
    event_signups: Db['event_signups'];
    trip_signups: Db['trip_signups'];
    pub_crawl_signups: Db['pub_crawl_signups'];
    trip_signup_activities: Db['trip_signup_activities'];
    trip_activities: Db['trip_activities'];
    pub_crawl_signups_transactions: Db['pub_crawl_signups_transactions'];
    coupons: Db['coupons'];
}

declare module 'fastify' {
    interface FastifyInstance {
        db: Kysely<Database>;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    await Promise.resolve();

    const pool = new Pool({
        host: process.env.DB_HOST || 'v7-core-db',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await pool.query('SELECT NOW()');

        const db = new Kysely<Database>({
            dialect: new PostgresDialect({
                pool
            })
        });

        fastify.decorate('db', db);
        fastify.log.info('[FINANCE] Database pool and Kysely initialized');
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        fastify.log.error(`[FINANCE] Error connecting database: ${err.message}`);
        throw error;
    }

    fastify.addHook('onClose', async (instance) => {
        await instance.db.destroy();
        await pool.end();
    });
});