import { safeConsoleError } from './utils/logger.js';
import Fastify from 'fastify';
import mailRoutes from './routes/mail.routes.js';
import redisPlugin from './plugins/redis.js';
import rateLimit from '@fastify/rate-limit';
import { db, client } from './services/db.js';
import { MailWorkerService } from './services/mail-worker.js';
import { EventListenerService } from './services/event-listener.js';

const fastify = Fastify({
    logger: true,
    trustProxy: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10']
});

fastify.get('/health', { logLevel: 'silent' }, () => {
    return {
        status: 'ok',
        service: 'mail-service',
        environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
        publicUrl: process.env.PUBLIC_URL || 'not set'
    };
});

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
        errorResponseBuilder: (_request, context) => {
            return {
                statusCode: 429,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${context.after} seconds.`
            };
        }
    });

    instance.register(mailRoutes, { prefix: '/api/mail' });
});

fastify.addHook('onClose', async () => {
    await client.end();
});

const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });

        fastify.redis.on('error', (err: unknown) => {
            safeConsoleError('[server.ts][start] ', err);
        });

        MailWorkerService.startWorker(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

        EventListenerService.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

    } catch (error) {
        safeConsoleError('[server.ts][start] ', error);
        process.exit(1);
    }
};

void start();