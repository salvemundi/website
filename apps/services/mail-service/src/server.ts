import { safeConsoleError } from './utils/logger.js';
import Fastify from 'fastify';

/**
 * Mail Service - Salve Mundi V7
 * Handles email rendering and dispatching via templates.
 */

const fastify = Fastify({
    logger: true
});

fastify.get('/health', async () => {
    await Promise.resolve();
    return { status: 'ok', service: 'mail-service' };
});

import mailRoutes from './routes/mail.routes.js';

// Register Plugins
import redisPlugin from './plugins/redis.js';
import rateLimit from '@fastify/rate-limit';

fastify.register(redisPlugin);

fastify.register(async (instance) => {
    await Promise.resolve();
    instance.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis: instance.redis,
        keyGenerator: (request) => {
            return request.ip || 'global-mail-limit';
        },
        errorResponseBuilder: (request, context) => {
            return {
                statusCode: 429,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${context.after} seconds.`
            };
        }
    });

    // Register Routes
    instance.register(mailRoutes, { prefix: '/api/mail' });
});

fastify.addHook('onClose', async () => {
    const { db } = await import('./services/db.js');
    await db.destroy();
});

const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log('Mail Service listening on port 3003');

        // Start the Mail Worker (background loop)
        const { MailWorkerService } = await import('./services/mail-worker.js');
        void MailWorkerService.startWorker(fastify.redis);

        // Start the Event Listener
        const { EventListenerService } = await import('./services/event-listener.js');
        void EventListenerService.start(fastify.redis);
    } catch (error) {
        safeConsoleError('Mail Service crashed:', error);
        process.exit(1);
    }
};

void start();
