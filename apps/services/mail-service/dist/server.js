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
// Register Plugins
import redisPlugin from './plugins/redis.js';
import rateLimit from '@fastify/rate-limit';
fastify.register(redisPlugin);
fastify.register(async (instance) => {
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
const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log('Mail Service listening on port 3003');
        // Start the Mail Worker (background loop)
        const { MailWorkerService } = await import('./services/mail-worker.js');
        MailWorkerService.startWorker(fastify.redis);
        // Start the Event Listener
        const { EventListenerService } = await import('./services/event-listener.js');
        EventListenerService.start(fastify.redis);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
