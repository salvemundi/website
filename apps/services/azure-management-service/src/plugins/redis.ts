import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Redis } from 'ioredis';

declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
    const url = process.env.REDIS_URL || 'redis://v7-core-redis:6379';

    const client = new Redis(url, {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
            return Math.min(times * 50, 2000);
        }
    });

    client.on('error', (error: Error) => {
        fastify.log.error({ err: error }, 'Redis Client Error');
    });

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        await instance.redis.quit();
    });
};

export default fp(redisPlugin, {
    name: 'custom-redis-plugin',
    fastify: '5.x'
});