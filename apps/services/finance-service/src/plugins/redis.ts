import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createClient } from 'redis';

declare module 'fastify' {
    interface FastifyInstance {
        redis: ReturnType<typeof createClient>;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    const url = process.env.REDIS_URL || 'redis://v7-core-redis:6379';
    const client = createClient({ url });

    client.on('error', (err) => fastify.log.error('Redis Client Error', err));

    await client.connect();
    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        await instance.redis.disconnect();
    });
});
