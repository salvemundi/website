import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { type DirectusSchema } from '@salvemundi/validations';

const { Pool } = pg;

export interface Database {
    transactions: DirectusSchema['transactions'][number];
    event_signups: DirectusSchema['event_signups'][number];
    trip_signups: DirectusSchema['trip_signups'][number];
    pub_crawl_signups: DirectusSchema['pub_crawl_signups'][number];
    trip_signup_activities: DirectusSchema['trip_signup_activities'][number];
    trip_activities: DirectusSchema['trip_activities'][number];
    pub_crawl_signups_transactions: DirectusSchema['pub_crawl_signups_transactions'][number];
    coupons: DirectusSchema['coupons'][number];
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