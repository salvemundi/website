import { safeConsoleError, logInfo } from './utils/logger.js';
import Fastify from 'fastify';
import redisPlugin from './plugins/redis.js';
import syncRoutes from './routes/sync.js';
import client from './plugins/db.js';
import { ProvisionWorkerService } from './services/provision-worker.js';
import { EventListenerService } from './services/event-listener.js';
import { ExpiryCheckJob } from './services/expiry-check.job.js';
import { EventReminderJob } from './services/event-reminder.job.js';
import { FullSyncJob } from './services/full-sync.job.js';

const fastify = Fastify({
    logger: true,
    trustProxy: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10']
});

fastify.register(redisPlugin);
fastify.register(syncRoutes, { prefix: '/api/sync' });

fastify.get('/health', { logLevel: 'silent' }, () => {
    return {
        status: 'ok',
        service: 'azure-sync-service',
        environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
        publicUrl: process.env.PUBLIC_URL || 'not set'
    };
});

fastify.addHook('onClose', async () => {
    ProvisionWorkerService.stop();
    EventListenerService.stop();
    ExpiryCheckJob.stop();
    EventReminderJob.stop();
    FullSyncJob.stop();
    await client.end();
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3002;
        await fastify.listen({ port, host: '0.0.0.0' });
        logInfo(`[server.ts][start] Azure Sync Service listening on port ${port}`);

        fastify.redis.on('error', (err: unknown) => {
            safeConsoleError('[server.ts][start] ', err);
        });

        ProvisionWorkerService.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

        EventListenerService.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

        ExpiryCheckJob.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

        EventReminderJob.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

        FullSyncJob.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });

    } catch (error: unknown) {
        safeConsoleError('[server.ts][start] ', error);
        process.exit(1);
    }
};

void start();