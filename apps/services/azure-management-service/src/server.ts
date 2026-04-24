import Fastify from 'fastify';
import dotenv from 'dotenv';
import multipart from '@fastify/multipart';
import redisPlugin from './plugins/redis.js';
import provisioningRoutes from './routes/provisioning.js';
import groupRoutes from './routes/groups.js';
import userRoutes from './routes/users.js';
import monitoringRoutes from './routes/monitoring.js';

dotenv.config();

const fastify = Fastify({
    logger: true
});

// Register Plugins
fastify.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
fastify.register(redisPlugin);

// Register Routes
fastify.register(provisioningRoutes, { prefix: '/api/provisioning' });
fastify.register(groupRoutes, { prefix: '/api/groups' });
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(monitoringRoutes, { prefix: '/api/monitoring' });

fastify.get('/health', async () => {
    return { status: 'ok', service: 'azure-management-service' };
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3004;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Azure Management Service listening on port ${port}`);

        // Start the Provisioning Worker
        const { ProvisionWorkerService } = await import('./services/provision-worker.js');
        ProvisionWorkerService.start(fastify.redis);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
