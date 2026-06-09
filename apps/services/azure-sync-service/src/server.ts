import { safeConsoleError, logInfo } from './utils/logger.js';
import Fastify from 'fastify';
import dotenv from 'dotenv';
import redisPlugin from './plugins/redis.js';
import syncRoutes from './routes/sync.js';

dotenv.config();

const fastify = Fastify({
    logger: true,
    trustProxy: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10']
});

fastify.register(redisPlugin);
fastify.register(syncRoutes, { prefix: '/api/sync' });

fastify.get('/health', () => {
    return {
        status: 'ok',
        service: 'azure-sync-service',
        environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
        publicUrl: process.env.PUBLIC_URL || 'not set'
    };
});

fastify.addHook('onClose', async () => {
    const { db } = await import('./plugins/db.js');
    await db.destroy();
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3002;
        await fastify.listen({ port, host: '0.0.0.0' });
        logInfo(`Azure Sync Service listening on port ${port}`);

        fastify.redis.on('error', (err: unknown) => {
            safeConsoleError('[server.ts][redisError]', err);
        });

        const { ProvisionWorkerService } = await import('./services/provision-worker.js');
        const { EventListenerService } = await import('./services/event-listener.js');
        const { ExpiryCheckJob } = await import('./services/expiry-check.job.js');
        const { EventReminderJob } = await import('./services/event-reminder.job.js');
        const { FullSyncJob } = await import('./services/full-sync.job.js');

        ProvisionWorkerService.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][provisionWorker]', error);
            process.exit(1);
        });

        EventListenerService.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][eventListener]', error);
            process.exit(1);
        });

        ExpiryCheckJob.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][expiryCheckJob]', error);
            process.exit(1);
        });

        EventReminderJob.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][eventReminderJob]', error);
            process.exit(1);
        });

        FullSyncJob.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][fullSyncJob]', error);
            process.exit(1);
        });

    } catch (error: unknown) {
        safeConsoleError('[server.ts][start]', error);
        process.exit(1);
    }
};

void start();
