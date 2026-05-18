import { safeConsoleError } from './utils/logger.js';
import Fastify from 'fastify';

const fastify = Fastify({
    logger: true
});

fastify.get('/health', () => {
    return { status: 'ok', service: 'finance-service' };
});

// Import Plugins & Routes statically to avoid Fastify TS inference issues
import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import mollieRoutes from './routes/mollie.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import tripRoutes from './routes/trip.routes.js';
import statusRoutes from './routes/status.routes.js';

// Register Plugins
fastify.register(dbPlugin);
fastify.register(redisPlugin);

// Register Routes
fastify.register(mollieRoutes, { prefix: '/api/finance' });
fastify.register(paymentsRoutes, { prefix: '/api/payments' });
fastify.register(tripRoutes, { prefix: '/api/finance' });
fastify.register(statusRoutes, { prefix: '/api/finance' });

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        fastify.log.info('Finance Service listening on port 3001');

        // Start background workers
        const { CacheInvalidationService } = await import('./services/cache-invalidation.js');
        const { DirectusRetryService } = await import('./services/directus-retry.service.js');
        const { AzureRetryService } = await import('./services/azure-retry.service.js');

        void CacheInvalidationService.startWorker(fastify.redis);
        void DirectusRetryService.startWorker(fastify.redis);
        void AzureRetryService.startWorker(fastify.redis);
    } catch (error) {
        safeConsoleError('Finance Service crashed:', error);
        process.exit(1);
    }
};

void start();