import fp from 'fastify-plugin';
import Redis from 'ioredis';

export default fp(async (fastify) => {
    const redisUrl = process.env.REDIS_URL || 'redis://v7-core-redis:6379';
    
    const client = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
    });

    client.on('error', (err: Error) => fastify.log.error(err, 'Redis Client Error'));

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        const { MailWorkerService } = await import('../services/mail-worker.js');
        MailWorkerService.stopWorker();
        await instance.redis.quit();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}
