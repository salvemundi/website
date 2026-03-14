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

import mailRoutes from './routes/mail.routes.js';

// Register Routes
fastify.register(mailRoutes, { prefix: '/api/mail' });

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
