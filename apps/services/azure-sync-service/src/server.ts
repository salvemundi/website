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
    return { status: 'ok', service: 'azure-sync-service' };
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3002;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Azure Sync Service listening on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
