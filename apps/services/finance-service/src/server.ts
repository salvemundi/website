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

// Register Plugins
fastify.register(import('./plugins/db.js'));
fastify.register(import('./plugins/redis.js'));

// Register Routes
fastify.register(import('./routes/mollie.routes.js'), { prefix: '/api/finance' });

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
