import Fastify from 'fastify';

/**
 * Finance Service - Salve Mundi V7
 * Handles asynchronous payment processing via Mollie Webhooks.
 */

const fastify = Fastify({
    logger: true
});

// Hello World / Health Check as per Docs
fastify.get('/health', async () => {
    return { status: 'ok', service: 'finance-service' };
});

// Placeholder for Mollie Webhook (Docs section 2.1)
fastify.post('/api/finance/webhook/mollie', async (request, reply) => {
    // Logic to be implemented: Verify Mollie-Signature and update transactions
    return { received: true };
});

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
