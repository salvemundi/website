import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { type DirectusSchema } from '@salvemundi/validations';

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
    // DB_URL should be provided in .env (e.g. postgresql://user:pass@host:port/db)
    const pool = new Pool({
        connectionString: process.env.DB_URL
    });

    try {
        await pool.query('SELECT NOW()'); // Verify connection

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
