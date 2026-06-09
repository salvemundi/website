import { safeConsoleError } from './utils/logger.js';
import Fastify from 'fastify';
import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import mollieRoutes from './routes/mollie.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import tripRoutes from './routes/trip.routes.js';
import statusRoutes from './routes/status.routes.js';

const fastify = Fastify({
    logger: true,
    trustProxy: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10']
});

fastify.get('/health', () => {
    return {
        status: 'ok',
        service: 'finance-service',
        environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
        publicUrl: process.env.PUBLIC_URL || 'not set'
    };
});

fastify.register(dbPlugin);
fastify.register(redisPlugin);

fastify.register(mollieRoutes, { prefix: '/api/finance' });
fastify.register(paymentsRoutes, { prefix: '/api/payments' });
fastify.register(tripRoutes, { prefix: '/api/finance' });
fastify.register(statusRoutes, { prefix: '/api/finance' });


const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });

        fastify.redis.on('error', (err: unknown) => {
            safeConsoleError('[server.ts][redisError]', err);
        });

        const { CacheInvalidationService } = await import('./services/cache-invalidation.js');
        const { DirectusRetryService } = await import('./services/directus-retry.service.js');
        const { AzureRetryService } = await import('./services/azure-retry.service.js');

        CacheInvalidationService.startWorker(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][cacheInvalidationWorker]', error);
            process.exit(1);
        });

        DirectusRetryService.startWorker(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][directusRetryWorker]', error);
            process.exit(1);
        });

        AzureRetryService.startWorker(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][azureRetryWorker]', error);
            process.exit(1);
        });

    } catch (error) {
        safeConsoleError('[server.ts][start]', error);
        process.exit(1);
    }
};

void start();