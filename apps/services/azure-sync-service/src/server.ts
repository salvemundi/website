import { safeConsoleError, logInfo } from './utils/logger.js';
import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
    logger: true
});

// Import Plugins & Routes
import redisPlugin from './plugins/redis.js';
import syncRoutes from './routes/sync.js';

// Register Plugins
fastify.register(redisPlugin);

// Register Routes
fastify.register(syncRoutes, { prefix: '/api/sync' });

fastify.get('/health', async () => {
    await Promise.resolve();
    return { status: 'ok', service: 'azure-sync-service' };
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3002;
        await fastify.listen({ port, host: '0.0.0.0' });
        logInfo(`Azure Sync Service listening on port ${port}`);

        // Start the Provisioning Worker
        const { ProvisionWorkerService } = await import('./services/provision-worker.js');
        void ProvisionWorkerService.start(fastify.redis);

        // Start the Event Listener
        const { EventListenerService } = await import('./services/event-listener.js');
        void EventListenerService.start(fastify.redis);

        // Start the Expiry Check Job
        const { ExpiryCheckJob } = await import('./services/expiry-check.job.js');
        void ExpiryCheckJob.start(fastify.redis);

        // Start the Event Reminder Job
        const { EventReminderJob } = await import('./services/event-reminder.job.js');
        void EventReminderJob.start(fastify.redis);

        // Start the Nightly Full Sync Job
        const { FullSyncJob } = await import('./services/full-sync.job.js');
        void FullSyncJob.start(fastify.redis);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        safeConsoleError('Azure Sync Service crashed:', message);
        process.exit(1);
    }
};

void start();
