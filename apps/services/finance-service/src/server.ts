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

// Register Plugins
fastify.register(dbPlugin);
fastify.register(redisPlugin);

// Register Routes
fastify.register(mollieRoutes, { prefix: '/api/finance' });

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Finance Service listening on port 3001');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
