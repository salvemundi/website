import Fastify from 'fastify';
import dotenv from 'dotenv';
import provisioningRoutes from './routes/provisioning.js';

dotenv.config();

const fastify = Fastify({
    logger: true
});

// Register Routes
fastify.register(provisioningRoutes, { prefix: '/api/provisioning' });

fastify.get('/health', async () => {
    return { status: 'ok', service: 'azure-management-service' };
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3004;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Azure Management Service listening on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
