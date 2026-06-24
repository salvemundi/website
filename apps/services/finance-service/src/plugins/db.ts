import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { db, client, schema } from '@salvemundi/db';

declare module 'fastify' {
    interface FastifyInstance {
        db: typeof db;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    fastify.decorate('db', db);
    fastify.log.info('[FINANCE] Database and Drizzle ORM initialized');

    fastify.addHook('onClose', async () => {
        await client.end();
    });
});