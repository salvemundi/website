import fp from 'fastify-plugin';
import { createClient } from 'redis';

export default fp(async (fastify) => {
    const redisUrl = process.env.REDIS_URL || 'redis://v7-core-redis:6379';
    
    const client = createClient({
        url: redisUrl
    });

    client.on('error', (err: Error) => fastify.log.error(err, 'Redis Client Error'));

    await client.connect();

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        const { MailWorkerService } = await import('../services/mail-worker.js');
        MailWorkerService.stopWorker();
        await instance.redis.disconnect();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        redis: ReturnType<typeof createClient>;
    }
}
