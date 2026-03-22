import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    const url = process.env.REDIS_URL || 'redis://v7-core-redis:6379';
    const client = new Redis(url, {
        maxRetriesPerRequest: null
    });

    client.on('error', (err) => fastify.log.error('Redis Client Error', err));

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        await instance.redis.quit();
    });
});
