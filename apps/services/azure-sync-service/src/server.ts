import Fastify from 'fastify';

/**
 * Azure Sync Service - Salve Mundi V7
 * Manages Microsoft Graph API tokens and Entra ID synchronization.
 */

const fastify = Fastify({
    logger: true
});

// Hello World / Health Check as per Docs
fastify.get('/health', async () => {
    return { status: 'ok', service: 'azure-sync-service' };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log('Azure Sync Service listening on port 3002');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
