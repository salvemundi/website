import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { CacheInvalidationService } from '../services/cache-invalidation.js';
import { DirectusRetryService } from '../services/directus-retry.service.js';
import { AzureRetryService } from '../services/azure-retry.service.js';

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

    client.on('error', (error: Error) => fastify.log.error(error, 'Redis Client Error'));

    await new Promise<void>((resolve, reject) => {
        client.once('ready', () => {
            resolve();
        });
        client.once('error', (err) => {
            reject(err);
        });
    });

    fastify.decorate('redis', client);

    fastify.addHook('onClose', async (instance) => {
        CacheInvalidationService.stopWorker();
        DirectusRetryService.stopWorker();
        AzureRetryService.stopWorker();
        await instance.redis.quit();
    });
});