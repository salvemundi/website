import { safeConsoleError } from './utils/logger.js';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import redisPlugin from './plugins/redis.js';
import provisioningRoutes from './routes/provisioning.js';
import groupRoutes from './routes/groups.js';
import userRoutes from './routes/users.js';
import monitoringRoutes from './routes/monitoring.js';
import { ProvisionWorkerService } from './services/provision-worker.js';

const fastify = Fastify({
    logger: true
});

fastify.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

fastify.register(redisPlugin);

fastify.register(provisioningRoutes, { prefix: '/api/provisioning' });
fastify.register(groupRoutes, { prefix: '/api/groups' });
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(monitoringRoutes, { prefix: '/api/monitoring' });

fastify.get('/health', { logLevel: 'silent' }, () => {
    return {
        status: 'ok',
        service: 'azure-management-service',
        environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
        publicUrl: process.env.PUBLIC_URL || 'not set'
    };
});

fastify.addHook('onClose', () => {
    ProvisionWorkerService.stop();
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3004;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Azure Management Service listening on port ${port}`);

        ProvisionWorkerService.start(fastify.redis).catch((error: unknown) => {
            safeConsoleError('[server.ts][start] ', error);
            process.exit(1);
        });
    } catch (error) {
        safeConsoleError('[server.ts][start] Azure Management Service failed to start:', error);
        process.exit(1);
    }
};

void start();