import Fastify from 'fastify';
import dotenv from 'dotenv';
import syncRoutes from './routes/sync.js';

dotenv.config();

const fastify = Fastify({
    logger: true
});

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
