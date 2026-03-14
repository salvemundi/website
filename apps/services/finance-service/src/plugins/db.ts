import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from 'pg';

declare module 'fastify' {
    interface FastifyInstance {
        db: pg.Client;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    // DB_URL should be provided in .env (e.g. postgresql://user:pass@host:port/db)
    const client = new pg.Client({
        connectionString: process.env.DB_URL
    });

    await client.connect();
    fastify.decorate('db', client);

    fastify.addHook('onClose', async (instance) => {
        await instance.db.end();
    });
});
