import { FastifyInstance } from 'fastify';
import { SyncJob } from '../services/sync.job.js';
import { TokenService } from '../services/token.service.js';

export default async function syncRoutes(fastify: FastifyInstance) {
    fastify.post('/run', async (request, reply) => {
        // Simple internal security check
        const authHeader = request.headers['authorization'];
        if (authHeader !== `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            // Get token (cached or new)
            const token = await TokenService.getAccessToken(fastify.redis);
            
            // Run sync asynchronously
            SyncJob.run(token).catch(err => console.error('[SYNC] Job failed:', err));

            return { message: 'Sync job started' };
        } catch (err: any) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Failed to start sync job', details: err.message });
        }
    });
}
