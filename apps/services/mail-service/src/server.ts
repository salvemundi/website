import Fastify from 'fastify';

/**
 * Mail Service - Salve Mundi V7
 * Handles email rendering and dispatching via templates.
 */

const fastify = Fastify({
    logger: true
});

fastify.get('/health', async () => {
    return { status: 'ok', service: 'mail-service' };
});

// Register Routes
fastify.register(import('./routes/mail.routes.js'), { prefix: '/api/mail' });

const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log('Mail Service listening on port 3003');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
