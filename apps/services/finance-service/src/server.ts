import Fastify from 'fastify';

/**
 * Finance Service - Salve Mundi V7
 * Handles asynchronous payment processing via Mollie Webhooks.
 */

const fastify = Fastify({
    logger: true
});

fastify.get('/health', async () => {
    return { status: 'ok', service: 'finance-service' };
});

// Import Plugins & Routes statically to avoid Fastify TS inference issues
import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import mollieRoutes from './routes/mollie.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import couponsRoutes from './routes/coupons.routes.js';
import tripRoutes from './routes/trip.routes.js';
import statusRoutes from './routes/status.routes.js';

// Register Plugins
fastify.register(dbPlugin);
fastify.register(redisPlugin);

// Register Routes
fastify.register(mollieRoutes, { prefix: '/api/finance' });
fastify.register(paymentsRoutes, { prefix: '/api/payments' });
fastify.register(couponsRoutes, { prefix: '/api/coupons' });
fastify.register(tripRoutes, { prefix: '/api/finance' });
fastify.register(statusRoutes, { prefix: '/api/finance' });

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Finance Service listening on port 3001');

        // Start background workers
        const { CacheInvalidationService } = await import('./services/cache-invalidation.js');
        const { DirectusRetryService } = await import('./services/directus-retry.service.js');
        const { AzureRetryService } = await import('./services/azure-retry.service.js');
        
        CacheInvalidationService.startWorker(fastify.redis);
        DirectusRetryService.startWorker(fastify.redis);
        AzureRetryService.startWorker(fastify.redis);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
