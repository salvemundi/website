import { FastifyInstance } from 'fastify';
import { SyncJob } from '../services/sync.job.js';

export default async function syncRoutes(fastify: FastifyInstance) {
    fastify.post('/run', async (request, reply) => {
        // Simple internal security check
        const authHeader = request.headers['authorization'];
        if (authHeader !== `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // Run sync asynchronously
        SyncJob.run().catch(err => console.error('[SYNC] Job failed:', err));

        return { message: 'Sync job started' };
    });
}
