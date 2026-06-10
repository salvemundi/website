import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { MailWorkerService } from '../services/mail-worker.js';
import { EventListenerService } from '../services/event-listener.js';

export default fp(async (fastify) => {
    await Promise.resolve();
    const redisUrl = process.env.REDIS_URL || 'redis://v7-core-redis:6379';

    const client = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
    });

    client.on('error', (error: Error) => fastify.log.error(error, 'Redis Client Error'));

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        MailWorkerService.stopWorker();
        EventListenerService.stop();
        await instance.redis.quit();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}