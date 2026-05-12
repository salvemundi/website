import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Pool } from 'pg';

declare module 'fastify' {
    interface FastifyInstance {
        db: Pool;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    // DB_URL should be provided in .env (error.g. postgresql://user:pass@host:port/db)
    const pool = new Pool({
        connectionString: process.env.DB_URL
    });

    try {
        await pool.query('SELECT NOW()'); // Verify connection
        fastify.decorate('db', pool);
        fastify.log.info('[FINANCE] Database pool initialized');
    } catch (error: any) {
        fastify.log.error(`[FINANCE] Error connecting database: ${error.message}`);
        throw error;
    }

    fastify.addHook('onClose', async (instance) => {
        await instance.db.end();
    });
});
